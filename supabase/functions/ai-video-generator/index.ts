import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, d?: Record<string, unknown>) =>
  console.log(`[AI-VIDEO] ${step}${d ? ` ${JSON.stringify(d)}` : ""}`);

const DURATION_CREDITS: Record<number, number> = { 10: 130, 15: 180, 20: 240, [-1]: 400 };

const STYLE_PROMPTS: Record<string, string> = {
  cyberpunk: "Cyberpunk neon-lit city, rain-soaked streets, holographic signs, cinematic lighting",
  anime: "Anime universe, vibrant cel-shaded art, dramatic action sequences",
  luxury: "Luxury nightclub, champagne, velvet, golden lights, VIP atmosphere",
  dystopian: "Dystopian post-apocalyptic world, dark skies, marching armies",
  concert: "Futuristic concert stage, laser lights, massive crowd, smoke machines",
  abstract: "Abstract geometric visualizer, pulsing shapes synced to music, vivid colors",
  nature: "Cinematic nature, sweeping drone shots, golden hour, mountains and oceans",
  retro: "Retro VHS aesthetic, scan lines, 80s colors, analog distortion",
};

const REPLICATE_API = "https://api.replicate.com/v1/predictions";

async function waitForPrediction(predictionId: string, apiToken: string, maxPolls = 120): Promise<{ status: string; output: unknown; error?: string }> {
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${REPLICATE_API}/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      log("Poll HTTP error", { status: res.status });
      continue;
    }
    const data = await res.json();
    log("Poll status", { status: data.status, poll: i + 1 });
    if (data.status === "succeeded") return { status: "succeeded", output: data.output };
    if (data.status === "failed" || data.status === "canceled") return { status: data.status, output: null, error: data.error || "Generation failed" };
  }
  return { status: "timeout", output: null, error: "Generation timed out after 10 minutes" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let userId: string | null = null;
  let jobId: string | null = null;
  let creditCost = 0;

  try {
    log("Function started");

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) throw new Error("REPLICATE_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) throw new Error("Not authenticated");
    userId = userData.user.id;

    // Parse body
    const body = await req.json();
    const {
      prompt,
      track_id = null,
      video_type = "music_video",
      export_format = "9:16",
      duration_seconds = 30,
      style = "cyberpunk",
      scene_prompt = "",
    } = body;

    const duration = duration_seconds || 30;
    creditCost = DURATION_CREDITS[duration];
    if (creditCost === undefined) {
      return new Response(JSON.stringify({ error: "Invalid duration." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    // Deduct credits
    log("Deducting credits", { creditCost, duration, video_type });
    const { data: deductResult } = await supabase.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });
    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${creditCost} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    // Log credit usage
    await supabase.from("ai_credit_usage").insert({
      user_id: userId, action: "video_studio", credits_used: creditCost,
      metadata: { video_type, export_format, duration, style, scene_prompt: (scene_prompt || prompt || "").substring(0, 200) },
    });

    // Insert job as queued
    const { data: job, error: jobError } = await supabase
      .from("ai_video_jobs")
      .insert({
        user_id: userId,
        track_id: track_id || null,
        video_type, export_format,
        duration_seconds: duration,
        scene_prompt: scene_prompt || prompt || null,
        style, credits_used: creditCost,
        status: "queued",
        metadata: { watermark: true, beat_sync: true },
      })
      .select("id")
      .single();

    if (jobError) throw new Error(`Job insert failed: ${jobError.message}`);
    jobId = job.id;
    log("Job queued", { jobId });

    // Build prompt for Replicate
    const styleDesc = STYLE_PROMPTS[style] || style;
    const fullPrompt = [
      styleDesc,
      scene_prompt || prompt || "",
      `${video_type.replace("_", " ")} style`,
      "cinematic quality, high detail, smooth motion",
    ].filter(Boolean).join(". ");

    // Start Replicate prediction
    log("Starting Replicate prediction", { model: "minimax/video-01-live", prompt: fullPrompt.substring(0, 100) });

    const createRes = await fetch("https://api.replicate.com/v1/models/minimax/video-01-live/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: { prompt: fullPrompt, prompt_optimizer: true },
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      log("Replicate create error", { status: createRes.status, body: errBody });
      throw new Error(`Replicate API error: ${createRes.status}`);
    }

    const prediction = await createRes.json();
    const predictionId = prediction.id;
    log("Prediction created", { predictionId, status: prediction.status });

    // Update job to processing
    await supabase.from("ai_video_jobs").update({
      status: "processing",
      metadata: { watermark: true, beat_sync: true, prediction_id: predictionId },
    }).eq("id", jobId);

    // Return immediately — let the client poll. But continue processing in background.
    // Edge functions have a ~400s timeout on Supabase, so we'll poll here.
    let result: { status: string; output: unknown; error?: string };

    if (prediction.status === "succeeded") {
      result = { status: "succeeded", output: prediction.output };
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      result = { status: prediction.status, output: null, error: prediction.error };
    } else {
      result = await waitForPrediction(predictionId, REPLICATE_API_KEY, 60); // ~5 min max
    }

    if (result.status === "succeeded" && result.output) {
      log("Generation succeeded, downloading video");

      // Get the video URL from output
      const videoUrl = typeof result.output === "string"
        ? result.output
        : Array.isArray(result.output)
          ? result.output[0]
          : null;

      if (!videoUrl) throw new Error("No video URL in output");

      // Download video
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) throw new Error("Failed to download generated video");
      const videoBlob = await videoRes.blob();

      // Upload to ai-videos bucket
      const filePath = `${userId}/${jobId}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("ai-videos")
        .upload(filePath, videoBlob, { contentType: "video/mp4", upsert: true });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: publicUrl } = supabase.storage.from("ai-videos").getPublicUrl(filePath);

      // Update job as completed
      await supabase.from("ai_video_jobs").update({
        status: "completed",
        output_url: publicUrl.publicUrl,
        completed_at: new Date().toISOString(),
        metadata: { watermark: true, beat_sync: true, prediction_id: predictionId },
      }).eq("id", jobId);

      log("Job completed", { jobId, outputUrl: publicUrl.publicUrl });

      // Try to send push notification (fire and forget)
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: { user_id: userId, title: "Video Ready! 🎬", body: "Your AI video has finished generating.", data: { route: "/ai-video" } },
        });
      } catch (e) { log("Push notification failed (non-critical)", { error: String(e) }); }

      return new Response(JSON.stringify({
        status: "completed", job_id: jobId,
        output_url: publicUrl.publicUrl,
        credits_used: creditCost,
        credits_remaining: deductResult.new_credits,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

    } else {
      // Failed or timed out — refund credits
      throw new Error(result.error || "Video generation failed");
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg, jobId });

    // Refund credits if we deducted them
    if (userId && creditCost > 0) {
      log("Refunding credits", { userId, creditCost });
      await supabase.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
      // Log refund
      await supabase.from("ai_credit_usage").insert({
        user_id: userId, action: "video_studio_refund", credits_used: -creditCost,
        metadata: { reason: msg, job_id: jobId },
      });
    }

    // Mark job as failed
    if (jobId) {
      await supabase.from("ai_video_jobs").update({
        status: "failed",
        metadata: { error: msg.substring(0, 500) },
      }).eq("id", jobId);
    }

    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
