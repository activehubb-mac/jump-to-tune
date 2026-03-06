import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-COVER-ART] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

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

    const { prompt, style_hint, is_regenerate } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const creditCost = is_regenerate ? 1 : 3;

    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Not enough credits. Need ${creditCost}, have ${deductResult?.current_credits ?? 0}.`,
        credits_required: creditCost, credits_available: deductResult?.current_credits ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    logStep("Credits deducted", { cost: creditCost });

    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: is_regenerate ? "cover_regenerate" : "cover_art",
      credits_used: creditCost, metadata: { prompt: prompt.substring(0, 200), style_hint },
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fullPrompt = `Generate a 1:1 square album cover art. Style: ${style_hint || "modern, bold, visually striking"}. ${prompt}. No text on the image.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
      const status = imageResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI service busy. Credits refunded. Try again." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429,
        });
      }
      return new Response(JSON.stringify({ error: "Cover art generation failed. Credits refunded." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
      throw new Error("No image returned from AI");
    }

    logStep("Cover art generated successfully");

    return new Response(JSON.stringify({
      cover_image: imageUrl,
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
