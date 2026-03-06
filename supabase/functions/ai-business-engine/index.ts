import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { trackId } = await req.json();
    if (!trackId) throw new Error("trackId is required");

    // Deduct credits
    const { data: deductResult, error: deductError } = await supabase.rpc("deduct_ai_credits", {
      p_user_id: user.id,
      p_credits: CREDIT_COST,
    });

    if (deductError || !deductResult?.success) {
      return new Response(JSON.stringify({
        error: "Insufficient AI credits",
        required: CREDIT_COST,
        current: deductResult?.current_credits ?? 0,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Record usage
    await supabase.from("ai_credit_usage").insert({
      user_id: user.id,
      action: "business_engine",
      credits_used: CREDIT_COST,
      metadata: { track_id: trackId },
    });

    // Get track + artist info
    const { data: track } = await supabase
      .from("tracks")
      .select("title, genre, mood_tags, description, artist_id, cover_art_url")
      .eq("id", trackId)
      .single();

    if (!track) throw new Error("Track not found");

    const { data: artist } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", track.artist_id)
      .single();

    const artistName = artist?.display_name || "Unknown Artist";
    const moods = Array.isArray(track.mood_tags) ? track.mood_tags.join(", ") : "";

    // Call AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a music marketing expert for JumTunes, the AI Music Release Platform. Generate a release kit for AI-generated music. Return JSON with these fields:
- instagram_caption: engaging Instagram post caption with emojis and hashtags (max 300 chars)
- tiktok_caption: viral TikTok caption (max 150 chars)  
- twitter_post: X/Twitter announcement post (max 280 chars)
- press_release: short press blurb (2-3 sentences)
- marketing_tagline: catchy one-liner for ads
- suggested_hashtags: array of 5-8 relevant hashtags`;

    const userPrompt = `Track: "${track.title}"
Artist: ${artistName}
Genre: ${track.genre || "Not specified"}
Moods: ${moods || "Not specified"}
Description: ${track.description || "AI-generated track"}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_release_kit",
            description: "Generate a complete release marketing kit",
            parameters: {
              type: "object",
              properties: {
                instagram_caption: { type: "string" },
                tiktok_caption: { type: "string" },
                twitter_post: { type: "string" },
                press_release: { type: "string" },
                marketing_tagline: { type: "string" },
                suggested_hashtags: { type: "array", items: { type: "string" } },
              },
              required: ["instagram_caption", "tiktok_caption", "twitter_post", "press_release", "marketing_tagline", "suggested_hashtags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_release_kit" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const releaseKit = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!releaseKit) throw new Error("Failed to parse AI response");

    return new Response(JSON.stringify({
      success: true,
      release_kit: releaseKit,
      credits_used: CREDIT_COST,
      credits_remaining: deductResult.new_credits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AI-BUSINESS-ENGINE] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
