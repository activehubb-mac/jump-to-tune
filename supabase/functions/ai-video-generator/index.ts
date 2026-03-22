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
      avatar_url = null,
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

    // Start Replicate prediction — DO NOT WAIT, return immediately
    log("Starting Replicate prediction", { model: "minimax/video-01", prompt: fullPrompt.substring(0, 100) });

    const createRes = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { prompt: fullPrompt, prompt_optimizer: true },
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      log("Replicate create error", { status: createRes.status, body: errBody });
      let detail = `Replicate API error: ${createRes.status}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.detail) detail = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      } catch { /* use default */ }
      throw new Error(detail);
    }

    const prediction = await createRes.json();
    const predictionId = prediction.id;
    log("Prediction created — returning immediately", { predictionId, status: prediction.status });

    // Update job to processing with prediction_id
    await supabase.from("ai_video_jobs").update({
      status: "processing",
      metadata: { watermark: true, beat_sync: true, prediction_id: predictionId },
    }).eq("id", jobId);

    // Return immediately — frontend will poll via poll-video-job
    return new Response(JSON.stringify({
      status: "processing",
      job_id: jobId,
      prediction_id: predictionId,
      credits_used: creditCost,
      credits_remaining: deductResult.new_credits,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg, jobId });

    // Refund credits if we deducted them
    if (userId && creditCost > 0) {
      log("Refunding credits", { userId, creditCost });
      await supabase.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
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
