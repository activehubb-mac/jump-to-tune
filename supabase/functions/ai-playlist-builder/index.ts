import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-PLAYLIST-BUILDER] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const CREDIT_COST = 3;

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

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: CREDIT_COST,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${CREDIT_COST} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId, action: "playlist_builder", credits_used: CREDIT_COST,
      metadata: { prompt: prompt.substring(0, 200) },
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch available tracks for recommendations
    const { data: tracks } = await supabaseClient
      .from("tracks")
      .select("id, title, genre")
      .limit(100)
      .order("created_at", { ascending: false });

    const trackList = (tracks || []).map(t => `${t.title} (${t.genre || "unknown"})`).join(", ");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are a playlist curator AI for JumTunes. Generate a playlist. Available tracks on the platform: ${trackList || "none yet"}. Call the "generate_playlist" function.` },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_playlist",
            description: "Generate a playlist concept",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Creative playlist name" },
                description: { type: "string", description: "2-3 sentence playlist description" },
                cover_art_prompt: { type: "string", description: "Prompt for playlist cover art" },
                mood_tags: { type: "array", items: { type: "string" }, description: "3-5 mood tags" },
                recommended_genres: { type: "array", items: { type: "string" }, description: "Genres to include" },
              },
              required: ["name", "description", "cover_art_prompt", "mood_tags", "recommended_genres"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_playlist" } },
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

    let playlistData;
    try { playlistData = JSON.parse(toolCall.function.arguments); }
    catch { await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: CREDIT_COST }); throw new Error("Parse failed"); }

    // Generate cover art
    let coverBase64 = null;
    try {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: `Generate a 1:1 square playlist cover art. ${playlistData.cover_art_prompt}. No text.` }],
          modalities: ["image", "text"],
        }),
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        coverBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      }
    } catch {}

    // Find matching tracks
    const matchingTrackIds: string[] = [];
    if (tracks && playlistData.recommended_genres?.length) {
      const genres = playlistData.recommended_genres.map((g: string) => g.toLowerCase());
      for (const t of tracks) {
        if (t.genre && genres.some((g: string) => t.genre!.toLowerCase().includes(g))) {
          matchingTrackIds.push(t.id);
          if (matchingTrackIds.length >= 20) break;
        }
      }
    }

    return new Response(JSON.stringify({
      ...playlistData,
      cover_image: coverBase64,
      suggested_track_ids: matchingTrackIds,
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
