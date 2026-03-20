import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-VIDEO-GENERATOR] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const DURATION_CREDITS: Record<number, number> = { 15: 15, 30: 30, 60: 60, [-1]: 150 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

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
    const creditCost = DURATION_CREDITS[duration];
    if (creditCost === undefined) {
      return new Response(JSON.stringify({ error: "Invalid duration. Choose 15, 30, 60, or -1 (full)." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    logStep("Deducting credits", { creditCost, duration, video_type, export_format });

    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${creditCost} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    // Log credit usage
    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: "video_studio", credits_used: creditCost,
      metadata: { video_type, export_format, duration, style, scene_prompt: (scene_prompt || prompt || "").substring(0, 200) },
    });

    // Insert job into ai_video_jobs
    const { data: job, error: jobError } = await supabaseClient
      .from("ai_video_jobs")
      .insert({
        user_id: userId,
        track_id: track_id || null,
        video_type,
        export_format,
        duration_seconds: duration,
        scene_prompt: scene_prompt || prompt || null,
        style,
        credits_used: creditCost,
        status: "queued",
        metadata: { watermark: true, beat_sync: true },
      })
      .select("id")
      .single();

    if (jobError) {
      logStep("Job insert error", { error: jobError.message });
    }

    logStep("Video job queued", { jobId: job?.id, creditCost, duration, video_type, export_format, style });

    return new Response(JSON.stringify({
      status: "queued",
      job_id: job?.id ?? null,
      message: `${video_type.replace("_", " ")} (${duration === -1 ? "full" : duration + "s"}, ${export_format}, ${style}) queued.`,
      duration_seconds: duration,
      video_type,
      export_format,
      style,
      credits_used: creditCost,
      credits_remaining: deductResult.new_credits,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
