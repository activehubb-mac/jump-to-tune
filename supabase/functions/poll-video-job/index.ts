import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, d?: Record<string, unknown>) =>
  console.log(`[POLL-VIDEO] ${step}${d ? ` ${JSON.stringify(d)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) throw new Error("REPLICATE_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { job_id } = await req.json();
    if (!job_id) throw new Error("job_id required");

    // Fetch job — must belong to user
    const { data: job, error: jobError } = await supabase
      .from("ai_video_jobs")
      .select("*")
      .eq("id", job_id)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
      });
    }

    // Only poll if still processing
    if (job.status !== "processing" && job.status !== "queued") {
      return new Response(JSON.stringify({ status: job.status, output_url: job.output_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata = (job.metadata as Record<string, unknown>) || {};
    const predictionId = metadata.prediction_id as string;
    if (!predictionId) {
      return new Response(JSON.stringify({ status: "processing", message: "No prediction ID yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single check against Replicate
    log("Checking prediction", { predictionId, jobId: job_id });
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_KEY}`, "Content-Type": "application/json" },
    });

    if (!res.ok) {
      log("Replicate poll error", { status: res.status });
      return new Response(JSON.stringify({ status: "processing", message: "Replicate check failed, will retry" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prediction = await res.json();
    log("Prediction status", { status: prediction.status, jobId: job_id });

    if (prediction.status === "succeeded" && prediction.output) {
      // Get video URL
      const videoUrl = typeof prediction.output === "string"
        ? prediction.output
        : Array.isArray(prediction.output)
          ? prediction.output[0]
          : null;

      if (!videoUrl) throw new Error("No video URL in output");

      // Download video
      log("Downloading video", { jobId: job_id });
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) throw new Error("Failed to download generated video");
      const videoBlob = await videoRes.blob();

      // Upload to ai-videos bucket
      const filePath = `${userId}/${job_id}.mp4`;
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
        metadata: { ...metadata, prediction_id: predictionId },
      }).eq("id", job_id);

      log("Job completed", { jobId: job_id });

      // Push notification (fire and forget)
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: { user_id: userId, title: "Video Ready! 🎬", body: "Your AI video has finished generating.", data: { route: "/ai-video" } },
        });
      } catch { /* non-critical */ }

      return new Response(JSON.stringify({
        status: "completed",
        output_url: publicUrl.publicUrl,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      const errorMsg = prediction.error || "Video generation failed";
      log("Prediction failed", { jobId: job_id, error: errorMsg });

      // Refund credits
      const creditCost = job.credits_used || 0;
      if (creditCost > 0) {
        await supabase.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
        await supabase.from("ai_credit_usage").insert({
          user_id: userId, action: "video_studio_refund", credits_used: -creditCost,
          metadata: { reason: errorMsg, job_id },
        });
        log("Credits refunded", { creditCost });
      }

      await supabase.from("ai_video_jobs").update({
        status: "failed",
        metadata: { ...metadata, error: errorMsg.substring(0, 500) },
      }).eq("id", job_id);

      return new Response(JSON.stringify({ status: "failed", error: errorMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // Still processing
      return new Response(JSON.stringify({ status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
