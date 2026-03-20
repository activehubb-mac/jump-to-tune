import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEM_SEPARATION_CREDIT_COST = 2;

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

    // Verify track ownership or admin role
    const { data: track } = await admin
      .from("tracks")
      .select("id, artist_id")
      .eq("id", track_id)
      .single();

    if (!track) {
      return new Response(JSON.stringify({ success: false, error: "Track not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow track owner or admin
    const { data: isAdmin } = await admin.rpc("has_admin_role", { _user_id: user.id });
    if (track.artist_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Track not found or not owned" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct AI credits before processing
    const { data: deductResult, error: deductError } = await admin.rpc("deduct_ai_credits", {
      p_user_id: user.id,
      p_credits: STEM_SEPARATION_CREDIT_COST,
    });

    if (deductError || !deductResult?.success) {
      const currentCredits = deductResult?.current_credits ?? 0;
      return new Response(
        JSON.stringify({
          success: false,
          error: `Insufficient AI credits. You need ${STEM_SEPARATION_CREDIT_COST} credits but have ${currentCredits}.`,
          code: "INSUFFICIENT_CREDITS",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log credit usage
    await admin.from("ai_credit_usage").insert({
      user_id: user.id,
      action: "stem_separation",
      credits_used: STEM_SEPARATION_CREDIT_COST,
      metadata: { track_id },
    });

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
        version: "5a7041cc0f2b3f2e5a95c4f0a22b2e8a8e5a7041cc0f2b3f2e5a95c4f0a22b2e",
        input: {
          audio: audio_url,
          output_format: "mp3",
        },
      }),
    });

    if (!predictionRes.ok) {
      const errText = await predictionRes.text();
      console.error("Replicate API error:", errText);
      // Refund credits on failure
      await admin.rpc("add_ai_credits", { p_user_id: user.id, p_credits: STEM_SEPARATION_CREDIT_COST });
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
      // Refund credits on failure
      await admin.rpc("add_ai_credits", { p_user_id: user.id, p_credits: STEM_SEPARATION_CREDIT_COST });
      await admin
        .from("track_karaoke")
        .update({ stem_separation_status: "failed" })
        .eq("track_id", track_id);
      return new Response(JSON.stringify({ success: false, error: "Separation failed or timed out" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Demucs output
    const output = result.output;
    const vocalsUrl = output?.vocals;
    const otherUrl = output?.other;
    const drumsUrl = output?.drums;
    const bassUrl = output?.bass;

    let instrumentalStemUrl = otherUrl;
    if (!instrumentalStemUrl && typeof output === "string") {
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
        const { data } = admin.storage.from("instrumentals").getPublicUrl(path);
        return data.publicUrl;
      } catch (e) {
        console.error(`Failed to upload ${stemName}:`, e);
        return null;
      }
    };

    // Upload vocals and instrumental stems
    let uploadedVocalsUrl: string | null = null;
    let uploadedInstrumentalUrl: string | null = null;

    if (vocalsUrl) {
      uploadedVocalsUrl = await uploadStem(vocalsUrl, "vocals");
    }

    if (otherUrl) {
      uploadedInstrumentalUrl = await uploadStem(otherUrl, "instrumental");
    }

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
