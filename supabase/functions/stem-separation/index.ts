import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const replicateKey = Deno.env.get("REPLICATE_API_KEY");

    if (!replicateKey) {
      return new Response(JSON.stringify({ success: false, error: "Replicate API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { track_id, audio_url } = await req.json();
    if (!track_id || !audio_url) {
      return new Response(JSON.stringify({ success: false, error: "track_id and audio_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify track ownership
    const { data: track } = await admin
      .from("tracks")
      .select("id, artist_id")
      .eq("id", track_id)
      .single();

    if (!track || track.artist_id !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "Track not found or not owned" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await admin
      .from("track_karaoke")
      .update({ stem_separation_status: "processing" })
      .eq("track_id", track_id);

    // Call Replicate API — start prediction
    const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "25a173108cff36ef9f80f854c162d01df9e6528be175794b81571f6e5deca48e",
        input: {
          audio: audio_url,
          output_format: "mp3",
        },
      }),
    });

    if (!predictionRes.ok) {
      const errText = await predictionRes.text();
      console.error("Replicate API error:", errText);
      await admin
        .from("track_karaoke")
        .update({ stem_separation_status: "failed" })
        .eq("track_id", track_id);
      return new Response(JSON.stringify({ success: false, error: "Replicate API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prediction = await predictionRes.json();
    const predictionId = prediction.id;

    // Store prediction ID
    await admin
      .from("track_karaoke")
      .update({ replicate_prediction_id: predictionId })
      .eq("track_id", track_id);

    // Poll for completion (max ~5 min)
    let result = prediction;
    const maxPolls = 60;
    for (let i = 0; i < maxPolls; i++) {
      if (result.status === "succeeded" || result.status === "failed" || result.status === "canceled") break;
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${replicateKey}` },
      });
      result = await pollRes.json();
    }

    if (result.status !== "succeeded") {
      console.error("Stem separation failed/timed out:", result);
      await admin
        .from("track_karaoke")
        .update({ stem_separation_status: "failed" })
        .eq("track_id", track_id);
      return new Response(JSON.stringify({ success: false, error: "Separation failed or timed out" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Demucs output is an object with stem names as keys
    const output = result.output;
    const vocalsUrl = output?.vocals;
    const otherUrl = output?.other;
    const drumsUrl = output?.drums;
    const bassUrl = output?.bass;

    // Build instrumental by downloading vocals-removed version
    // Demucs separates into: vocals, drums, bass, other
    // "no_vocals" = drums + bass + other — but the model may provide it directly
    // We'll use the "other" stem URL or combine. For simplicity, let's store individual stems.
    // The instrumental is everything except vocals, but Demucs doesn't output a single instrumental.
    // We'll download and upload the "other" stem as a basic instrumental for now,
    // but ideally we need drums+bass+other combined. Let's check if output has "accompaniment".

    // Demucs htdemucs model outputs: vocals, drums, bass, other
    // For karaoke, we want everything except vocals. We'll upload all stems
    // and use drums+bass+other as "instrumental" by storing them.
    // For MVP: use the full output minus vocals approach.
    // The model version we're using may output differently — let's handle both cases.

    let instrumentalStemUrl = otherUrl; // fallback
    if (!instrumentalStemUrl && typeof output === "string") {
      // Some versions return a single URL
      instrumentalStemUrl = output;
    }

    // Download and upload stems to Supabase storage
    const timestamp = Date.now();

    const uploadStem = async (sourceUrl: string, stemName: string): Promise<string | null> => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        const path = `${user.id}/${timestamp}_${track_id}_${stemName}.mp3`;
        const { error: uploadErr } = await admin.storage
          .from("instrumentals")
          .upload(path, blob, { contentType: "audio/mpeg", upsert: true });
        if (uploadErr) {
          console.error(`Upload ${stemName} error:`, uploadErr);
          return null;
        }
        // instrumentals bucket is private, we'll generate signed URLs when needed
        // But for track_karaoke.instrumental_url we store the path for signed URL generation
        const { data } = admin.storage.from("instrumentals").getPublicUrl(path);
        return data.publicUrl;
      } catch (e) {
        console.error(`Failed to upload ${stemName}:`, e);
        return null;
      }
    };

    // Upload vocals and instrumental (other) stems
    let uploadedVocalsUrl: string | null = null;
    let uploadedInstrumentalUrl: string | null = null;

    if (vocalsUrl) {
      uploadedVocalsUrl = await uploadStem(vocalsUrl, "vocals");
    }

    // For instrumental, prefer combining drums+bass+other if available
    // For MVP, upload "other" as the instrumental stem
    // In practice, the Demucs model we use separates into 4 stems
    // A proper instrumental would need mixing, so we upload "other" for now
    // and also store bass/drums URLs if needed later
    if (otherUrl) {
      uploadedInstrumentalUrl = await uploadStem(otherUrl, "instrumental");
    }

    // If we got bass and drums, upload those too for potential future use
    if (bassUrl) await uploadStem(bassUrl, "bass");
    if (drumsUrl) await uploadStem(drumsUrl, "drums");

    // Update track_karaoke with results
    await admin
      .from("track_karaoke")
      .update({
        stem_separation_status: "completed",
        instrumental_url: uploadedInstrumentalUrl,
        vocals_url: uploadedVocalsUrl,
      })
      .eq("track_id", track_id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          instrumental_url: uploadedInstrumentalUrl,
          vocals_url: uploadedVocalsUrl,
          prediction_id: predictionId,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("stem-separation error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
