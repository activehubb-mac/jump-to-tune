// Credit cost: 40 — canonical source: src/lib/aiPricing.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-ARTIST-DROP] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let userId: string | null = null;
  let creditsDeducted = false;
  const creditCost = 40;

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    userId = userData.user.id;

    const { genre, mood, song_idea, avatar_url, visual_theme } = await req.json();
    if (!genre || !mood) {
      return new Response(JSON.stringify({ error: "Genre and mood are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    // Deduct credits
    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Not enough credits. Need ${creditCost}, have ${deductResult?.current_credits ?? 0}.`,
        credits_required: creditCost, credits_available: deductResult?.current_credits ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }
    creditsDeducted = true;
    logStep("Credits deducted", { cost: creditCost });

    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: "artist_drop",
      credits_used: creditCost, metadata: { genre, mood, song_idea: song_idea?.substring(0, 200) },
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Generate song concept via text completion with tool calling
    logStep("Generating song concept");
    const conceptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a music industry expert and creative director. Generate compelling song concepts for artists.",
          },
          {
            role: "user",
            content: `Create a complete song concept for a ${genre} track with a ${mood} vibe.${song_idea ? ` Song idea: ${song_idea}` : ""} ${visual_theme ? `Artist visual theme: ${visual_theme}.` : ""}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_song_concept",
              description: "Create a complete song concept package",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy song title" },
                  description: { type: "string", description: "Release description (2-3 sentences)" },
                  genre_tags: { type: "array", items: { type: "string" }, description: "3-5 genre tags" },
                  mood_tags: { type: "array", items: { type: "string" }, description: "3-5 mood tags" },
                  lyrics_outline: { type: "string", description: "Brief lyrics outline with verse/chorus structure" },
                  cover_art_prompt: { type: "string", description: "Detailed prompt for album cover art generation" },
                },
                required: ["title", "description", "genre_tags", "mood_tags", "lyrics_outline", "cover_art_prompt"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_song_concept" } },
      }),
    });

    if (!conceptResponse.ok) {
      const status = conceptResponse.status;
      if (status === 429) {
        await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
        return new Response(JSON.stringify({ error: "AI service busy. Credits refunded. Try again." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429,
        });
      }
      throw new Error(`Concept generation failed with status ${status}`);
    }

    const conceptData = await conceptResponse.json();
    const toolCall = conceptData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No concept returned from AI");

    const concept = JSON.parse(toolCall.function.arguments);
    logStep("Song concept generated", { title: concept.title });

    // Step 2: Generate cover art
    logStep("Generating cover art");
    const artPrompt = `Generate a 1:1 square album cover art. ${concept.cover_art_prompt}. Genre: ${genre}. Mood: ${mood}.${visual_theme ? ` Visual theme: ${visual_theme}.` : ""} No text on the image. Professional quality.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: artPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`Cover art generation failed with status ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const coverImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!coverImage) throw new Error("No cover image returned from AI");

    logStep("Cover art generated successfully");

    return new Response(JSON.stringify({
      title: concept.title,
      description: concept.description,
      genre_tags: concept.genre_tags,
      mood_tags: concept.mood_tags,
      lyrics_outline: concept.lyrics_outline,
      cover_image: coverImage,
      avatar_url: avatar_url || null,
      credits_used: creditCost,
      credits_remaining: deductResult.new_credits,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });

    // Refund credits on failure
    if (creditsDeducted && userId) {
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
      logStep("Credits refunded");
    }

    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
