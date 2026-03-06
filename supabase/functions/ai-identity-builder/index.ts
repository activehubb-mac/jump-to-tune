import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-IDENTITY-BUILDER] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const CREDIT_COST = 5;

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

    const { genre, vibe, inspiration } = await req.json();

    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: CREDIT_COST,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${CREDIT_COST} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: "identity_builder", credits_used: CREDIT_COST,
      metadata: { genre, vibe },
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Generate identity metadata
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are a music branding AI for JumTunes. Generate a unique artist identity. You must call the "generate_identity" function.` },
          { role: "user", content: `Create an artist identity. Genre: ${genre || "any"}. Vibe: ${vibe || "modern and bold"}. Inspiration: ${inspiration || "none specified"}.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_identity",
            description: "Generate a complete artist identity",
            parameters: {
              type: "object",
              properties: {
                name_suggestions: { type: "array", items: { type: "string" }, description: "5 unique artist name suggestions" },
                bio: { type: "string", description: "A compelling 2-3 sentence artist bio" },
                visual_theme: { type: "string", description: "Description of the visual aesthetic (colors, style, mood)" },
                avatar_prompt: { type: "string", description: "Prompt for generating an artist avatar image" },
                tagline: { type: "string", description: "A catchy one-line tagline" },
              },
              required: ["name_suggestions", "bio", "visual_theme", "avatar_prompt", "tagline"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_identity" } },
      }),
    });

    if (!aiResponse.ok) {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST });
      return new Response(JSON.stringify({ error: "AI generation failed. Credits refunded." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST });
      throw new Error("AI did not return structured data");
    }

    let identityData;
    try { identityData = JSON.parse(toolCall.function.arguments); }
    catch { await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST }); throw new Error("Failed to parse AI data"); }

    // Generate avatar image
    let avatarBase64 = null;
    try {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: `Generate a 1:1 square artist avatar/profile picture. ${identityData.avatar_prompt}. Artistic, professional quality. No text.` }],
          modalities: ["image", "text"],
        }),
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        avatarBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      }
    } catch (e) {
      logStep("Avatar generation failed, continuing", { error: String(e) });
    }

    return new Response(JSON.stringify({
      ...identityData,
      avatar_image: avatarBase64,
      credits_used: CREDIT_COST,
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
