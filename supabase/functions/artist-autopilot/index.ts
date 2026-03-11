import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, session_id, track_id, prompt } = await req.json();

    if (action === "start") {
      // Deduct 150 credits
      const { data: deductResult } = await supabase.rpc("deduct_ai_credits", {
        p_user_id: user.id,
        p_credits: 150,
      });

      if (!deductResult?.success) {
        return new Response(JSON.stringify({
          error: "Insufficient credits",
          current_credits: deductResult?.current_credits || 0,
          required: 150,
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get track info
      const { data: track } = await supabase
        .from("tracks")
        .select("id, title, genre, moods, description, cover_art_url, audio_url, artist_id")
        .eq("id", track_id)
        .single();

      if (!track) {
        // Refund
        await supabase.rpc("add_ai_credits", { p_user_id: user.id, p_credits: 150 });
        return new Response(JSON.stringify({ error: "Track not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("autopilot_sessions")
        .insert({
          user_id: user.id,
          track_id: track.id,
          status: "processing",
          prompt: prompt || null,
          metadata: {
            track_title: track.title,
            genre: track.genre,
            moods: track.moods,
            description: track.description,
          },
        })
        .select("id")
        .single();

      if (sessionError) {
        await supabase.rpc("add_ai_credits", { p_user_id: user.id, p_credits: 150 });
        throw sessionError;
      }

      // Start async generation pipeline
      generateAssets(supabase, session!.id, track, user.id, prompt).catch((err) => {
        console.error("Autopilot pipeline error:", err);
        supabase.from("autopilot_sessions").update({ status: "failed" }).eq("id", session!.id);
      });

      return new Response(JSON.stringify({ success: true, session_id: session!.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: session } = await supabase
        .from("autopilot_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "publish") {
      // Mark track as not draft
      const { data: session } = await supabase
        .from("autopilot_sessions")
        .select("track_id, cover_art_url")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: Record<string, unknown> = { is_draft: false };
      if (session.cover_art_url) {
        updateData.cover_art_url = session.cover_art_url;
      }

      await supabase.from("tracks").update(updateData).eq("id", session.track_id);
      await supabase.from("autopilot_sessions").update({ status: "published" }).eq("id", session_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("artist-autopilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateAssets(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  track: Record<string, unknown>,
  userId: string,
  prompt?: string
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const updateProgress = async (step: string, status: string, extras?: Record<string, unknown>) => {
    const { data: current } = await supabase
      .from("autopilot_sessions")
      .select("progress")
      .eq("id", sessionId)
      .single();
    const progress = (current?.progress as Record<string, string>) || {};
    progress[step] = status;
    const update: Record<string, unknown> = { progress, ...extras };
    await supabase.from("autopilot_sessions").update(update).eq("id", sessionId);
  };

  const stylePrompt = prompt || `${track.genre || "modern"} music, ${(track.moods as string[] || []).join(", ") || "atmospheric"} mood`;

  // Step 1: Cover Art
  try {
    await updateProgress("cover_art", "generating");
    const coverResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Create album cover art for a song titled "${track.title}". Style: ${stylePrompt}. Professional music album artwork, high quality, square format.` }],
        modalities: ["image", "text"],
      }),
    });
    const coverData = await coverResponse.json();
    const coverImageUrl = coverData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (coverImageUrl) {
      // Upload to storage
      const base64Data = coverImageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const coverPath = `${userId}/autopilot_${sessionId}_cover.png`;
      await supabase.storage.from("covers").upload(coverPath, binaryData, { contentType: "image/png", upsert: true });
      const { data: publicUrl } = supabase.storage.from("covers").getPublicUrl(coverPath);
      await updateProgress("cover_art", "done", { cover_art_url: publicUrl.publicUrl });
    } else {
      await updateProgress("cover_art", "failed");
    }
  } catch (err) {
    console.error("Cover art generation failed:", err);
    await updateProgress("cover_art", "failed");
  }

  // Step 2: Avatar
  try {
    await updateProgress("avatar", "generating");
    const avatarResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Create a stylized artist avatar/character for a musician. Style: ${stylePrompt}. Digital art portrait, vibrant, professional, on a clean background.` }],
        modalities: ["image", "text"],
      }),
    });
    const avatarData = await avatarResponse.json();
    const avatarImageUrl = avatarData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (avatarImageUrl) {
      const base64Data = avatarImageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const avatarPath = `${userId}/autopilot_${sessionId}_avatar.png`;
      await supabase.storage.from("avatars").upload(avatarPath, binaryData, { contentType: "image/png", upsert: true });
      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
      await updateProgress("avatar", "done", { avatar_url: publicUrl.publicUrl });
    } else {
      await updateProgress("avatar", "failed");
    }
  } catch (err) {
    console.error("Avatar generation failed:", err);
    await updateProgress("avatar", "failed");
  }

  // Step 3: Lyric Visual
  try {
    await updateProgress("lyric_visual", "generating");
    const lyricResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Create a lyric video background/visual card for song "${track.title}". Style: ${stylePrompt}. Vertical format 9:16, cinematic, with space for text overlay. No text in image.` }],
        modalities: ["image", "text"],
      }),
    });
    const lyricData = await lyricResponse.json();
    const lyricImageUrl = lyricData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (lyricImageUrl) {
      const base64Data = lyricImageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const lyricPath = `${userId}/autopilot_${sessionId}_lyric.png`;
      await supabase.storage.from("covers").upload(lyricPath, binaryData, { contentType: "image/png", upsert: true });
      const { data: publicUrl } = supabase.storage.from("covers").getPublicUrl(lyricPath);
      await updateProgress("lyric_visual", "done", { lyric_visual_url: publicUrl.publicUrl });
    } else {
      await updateProgress("lyric_visual", "failed");
    }
  } catch (err) {
    console.error("Lyric visual generation failed:", err);
    await updateProgress("lyric_visual", "failed");
  }

  // Step 4: Karaoke prep (trigger stem separation if not already done)
  try {
    await updateProgress("karaoke", "generating");
    const { data: existingKaraoke } = await supabase
      .from("track_karaoke")
      .select("id")
      .eq("track_id", track.id as string)
      .maybeSingle();

    if (!existingKaraoke) {
      // Insert karaoke record and trigger stem separation
      await supabase.from("track_karaoke").insert({
        track_id: track.id,
        sing_mode_enabled: true,
        stage_enabled: true,
        stem_separation_status: "pending",
      });
    }
    await updateProgress("karaoke", "done");
  } catch (err) {
    console.error("Karaoke prep failed:", err);
    await updateProgress("karaoke", "failed");
  }

  // Step 5: Video placeholder (mark as ready for generation)
  await updateProgress("video", "ready");

  // Step 6: Promo clips metadata
  try {
    await updateProgress("promo_clips", "generating");
    const promoResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Generate promotional social media captions for a music release. Return JSON only." },
          { role: "user", content: `Song: "${track.title}". Genre: ${track.genre || "unknown"}. Mood: ${(track.moods as string[] || []).join(", ") || "atmospheric"}. Generate 3 short promo captions with hashtags for TikTok, Instagram, and Twitter.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_promo_captions",
            description: "Generate promotional captions",
            parameters: {
              type: "object",
              properties: {
                captions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      caption: { type: "string" },
                      hashtags: { type: "string" },
                    },
                    required: ["platform", "caption", "hashtags"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["captions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_promo_captions" } },
      }),
    });
    const promoData = await promoResponse.json();
    const toolCall = promoData.choices?.[0]?.message?.tool_calls?.[0];
    let captions: unknown[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        captions = parsed.captions || [];
      } catch {}
    }
    await updateProgress("promo_clips", "done", { promo_clips: captions });
  } catch (err) {
    console.error("Promo clips generation failed:", err);
    await updateProgress("promo_clips", "failed");
  }

  // Step 7: Release page ready
  await updateProgress("release_page", "done");

  // Mark session as complete
  await supabase.from("autopilot_sessions").update({
    status: "ready",
    completed_at: new Date().toISOString(),
  }).eq("id", sessionId);
}
