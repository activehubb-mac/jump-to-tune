import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-FAN-DISCOVERY] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 3 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    logStep("Processing fan discovery query", { query: query.slice(0, 100) });

    // Fetch available genres and moods from the database for context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get a sample of tracks with their metadata for context
    const { data: sampleTracks } = await supabaseClient
      .from("tracks")
      .select("title, genre, mood_tags, artist_id")
      .eq("is_draft", false)
      .limit(200);

    const availableGenres = [...new Set(sampleTracks?.map(t => t.genre).filter(Boolean) || [])];
    const availableMoods = [...new Set(sampleTracks?.flatMap(t => t.mood_tags || []).filter(Boolean) || [])];

    // Use AI to interpret the natural language query into search filters
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a music discovery assistant for JumTunes, an AI music platform. Users describe the kind of music they want using natural language. Your job is to interpret their query and return structured search filters.

Available genres on the platform: ${availableGenres.join(", ")}
Available mood tags: ${availableMoods.join(", ")}

Return filters that best match the user's intent.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_music",
              description: "Search for music based on interpreted filters from the user's natural language query.",
              parameters: {
                type: "object",
                properties: {
                  genres: {
                    type: "array",
                    items: { type: "string" },
                    description: "Matching genre names from the available list",
                  },
                  moods: {
                    type: "array",
                    items: { type: "string" },
                    description: "Matching mood tags from the available list",
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Additional keywords to search track titles",
                  },
                  description: {
                    type: "string",
                    description: "A brief, friendly description of what the user is looking for (1-2 sentences)",
                  },
                },
                required: ["genres", "moods", "keywords", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "search_music" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Discovery is temporarily busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI discovery is temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let filters = { genres: [] as string[], moods: [] as string[], keywords: [] as string[], description: "" };
    if (toolCall?.function?.arguments) {
      try {
        filters = JSON.parse(toolCall.function.arguments);
      } catch {
        logStep("Failed to parse AI response, using fallback");
      }
    }

    logStep("AI interpreted filters", filters);

    // Build the database query based on AI-interpreted filters
    let dbQuery = supabaseClient
      .from("tracks")
      .select("id, title, cover_art_url, price, genre, mood_tags, artist_id, audio_url, duration")
      .eq("is_draft", false)
      .limit(20);

    // Apply genre filter
    if (filters.genres.length > 0) {
      dbQuery = dbQuery.in("genre", filters.genres);
    }

    // Apply mood filter
    if (filters.moods.length > 0) {
      dbQuery = dbQuery.overlaps("mood_tags", filters.moods);
    }

    const { data: tracks, error: tracksError } = await dbQuery;
    if (tracksError) throw tracksError;

    // If genre/mood filters returned few results, also search by keywords in titles
    let keywordTracks: typeof tracks = [];
    if ((tracks?.length || 0) < 5 && filters.keywords.length > 0) {
      for (const keyword of filters.keywords.slice(0, 3)) {
        const { data: kTracks } = await supabaseClient
          .from("tracks")
          .select("id, title, cover_art_url, price, genre, mood_tags, artist_id, audio_url, duration")
          .eq("is_draft", false)
          .ilike("title", `%${keyword}%`)
          .limit(10);
        if (kTracks) keywordTracks.push(...kTracks);
      }
    }

    // Merge and deduplicate
    const allTracks = [...(tracks || [])];
    const existingIds = new Set(allTracks.map(t => t.id));
    for (const kt of keywordTracks) {
      if (!existingIds.has(kt.id)) {
        allTracks.push(kt);
        existingIds.add(kt.id);
      }
    }

    // Fetch artist names
    const artistIds = [...new Set(allTracks.map(t => t.artist_id).filter(Boolean))];
    let artistMap = new Map<string, string>();
    if (artistIds.length > 0) {
      const { data: artists } = await supabaseClient
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);
      artistMap = new Map(artists?.map(a => [a.id, a.display_name || "Unknown Artist"]) || []);
    }

    const results = allTracks.slice(0, 20).map(track => ({
      id: track.id,
      title: track.title,
      cover_art_url: track.cover_art_url,
      price: track.price,
      genre: track.genre,
      mood_tags: track.mood_tags,
      audio_url: track.audio_url,
      duration: track.duration,
      artist_id: track.artist_id,
      artist_name: artistMap.get(track.artist_id) || "Unknown Artist",
    }));

    logStep("Returning results", { count: results.length });

    return new Response(
      JSON.stringify({
        description: filters.description,
        filters: { genres: filters.genres, moods: filters.moods },
        tracks: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
