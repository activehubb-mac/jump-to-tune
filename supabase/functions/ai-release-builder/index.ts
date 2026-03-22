import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AI-RELEASE-BUILDER] ${step}${detailsStr}`);
};

const CREDIT_COST = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { prompt, ai_tool_used, lyrics, genre_hint } = await req.json();

    if (!prompt && !lyrics) {
      return new Response(
        JSON.stringify({ error: "Please provide a prompt or lyrics for the AI to work with." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Deduct AI credits atomically
    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId,
      p_credits: CREDIT_COST,
    });

    if (!deductResult?.success) {
      logStep("Insufficient AI credits", { current: deductResult?.current_credits, required: CREDIT_COST });
      return new Response(
        JSON.stringify({
          error: `Not enough AI credits. You need ${CREDIT_COST} credits but have ${deductResult?.current_credits ?? 0}.`,
          credits_required: CREDIT_COST,
          credits_available: deductResult?.current_credits ?? 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
      );
    }

    logStep("Credits deducted", { previous: deductResult.previous_credits, new: deductResult.new_credits });

    // Log usage
    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId,
      action: "release_builder",
      credits_used: CREDIT_COST,
      metadata: { prompt: prompt?.substring(0, 200), ai_tool_used },
    });

    // Call Lovable AI Gateway for release metadata
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a music release packaging AI for JumTunes, an AI music release platform. Given a description of a track (prompt, lyrics, genre hints), generate a complete release package.

You must call the "generate_release" function with the release data.

Guidelines:
- Title suggestions should be creative, catchy, and relevant to the content
- Description should be 2-3 sentences, compelling and suitable for a release page
- Genre tags should be 1-3 specific genres
- Mood tags should be 3-5 descriptive mood words
- Cover art prompt should describe a visually striking album cover that matches the music's vibe`;

    const userMessage = [
      prompt ? `Track prompt/description: ${prompt}` : "",
      ai_tool_used ? `AI tool used to create: ${ai_tool_used}` : "",
      lyrics ? `Lyrics:\n${lyrics}` : "",
      genre_hint ? `Genre hint: ${genre_hint}` : "",
    ].filter(Boolean).join("\n\n");

    logStep("Calling AI Gateway");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_release",
              description: "Generate a complete music release package with metadata",
              parameters: {
                type: "object",
                properties: {
                  title_suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 creative title suggestions for the track",
                  },
                  description: {
                    type: "string",
                    description: "A compelling 2-3 sentence release description",
                  },
                  genre_tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 genre tags",
                  },
                  mood_tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 mood descriptor tags",
                  },
                  cover_art_prompt: {
                    type: "string",
                    description: "A detailed prompt for generating album cover artwork",
                  },
                },
                required: ["title_suggestions", "description", "genre_tags", "mood_tags", "cover_art_prompt"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_release" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      logStep("AI Gateway error", { status, error: errorText });

      // Refund credits on AI failure
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST });
      logStep("Credits refunded due to AI error");

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Your credits have been refunded. Please try again in a moment." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Your credits have been refunded." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI generation failed. Your credits have been refunded. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    logStep("AI response received");

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Refund on parse failure
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST });
      throw new Error("AI did not return structured release data");
    }

    let releaseData;
    try {
      releaseData = JSON.parse(toolCall.function.arguments);
    } catch {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST });
      throw new Error("Failed to parse AI release data");
    }

    logStep("Release data generated", {
      titles: releaseData.title_suggestions?.length,
      genres: releaseData.genre_tags?.length,
      moods: releaseData.mood_tags?.length,
    });

    // Now generate cover art
    let coverImageBase64 = null;
    try {
      logStep("Generating cover art");
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Generate a 1:1 square album cover art. Style: modern, bold, visually striking. ${releaseData.cover_art_prompt}. No text on the image.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageUrl) {
          coverImageBase64 = imageUrl;
          logStep("Cover art generated successfully");
        }
      } else {
        logStep("Cover art generation failed, continuing without it", { status: imageResponse.status });
      }
    } catch (imgErr) {
      logStep("Cover art generation error", { error: imgErr instanceof Error ? imgErr.message : String(imgErr) });
    }

    return new Response(
      JSON.stringify({
        ...releaseData,
        cover_image: coverImageBase64,
        credits_used: CREDIT_COST,
        credits_remaining: deductResult.new_credits,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
