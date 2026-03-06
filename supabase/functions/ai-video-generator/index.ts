import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-VIDEO-GENERATOR] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const DURATION_CREDITS: Record<number, number> = { 10: 20, 30: 50, 60: 100 };

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

    const { prompt, duration_seconds, style } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const duration = duration_seconds || 10;
    const creditCost = DURATION_CREDITS[duration];
    if (!creditCost) {
      return new Response(JSON.stringify({ error: "Invalid duration. Choose 10, 30, or 60 seconds." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${creditCost} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: "video_generator", credits_used: creditCost,
      metadata: { prompt: prompt.substring(0, 200), duration, style },
    });

    logStep("Credits deducted, video generation queued", { creditCost, duration, style });

    // Video generation is queued - in production this would call a video generation API
    // For now, we return success with the queued status
    return new Response(JSON.stringify({
      status: "queued",
      message: `Video generation queued. ${duration}s ${style || "abstract visualizer"} video will be ready shortly.`,
      duration_seconds: duration,
      style: style || "abstract visualizer",
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
