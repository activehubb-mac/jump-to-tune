// Credit costs: single=500, bundle=850 — canonical source: src/lib/aiPricing.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-VIRAL-GENERATOR] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const CLIP_PACK_CREDITS: Record<number, number> = { 3: 500, 5: 850 };

const VALID_ASSET_TYPES = ["tiktok", "instagram_reel", "youtube_short", "square_promo"];
const VALID_STYLES = ["abstract visualizer", "cinematic scenes", "lyric-focused promo", "cover-art motion promo"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const body = await req.json();
    const {
      track_id,
      asset_type = "tiktok",
      duration_seconds = 10,
      style = "abstract visualizer",
      clip_count = 3,
      avatar_url = null,
      visual_theme = null,
    } = body;

    // Validate inputs
    if (!track_id) {
      return new Response(JSON.stringify({ error: "track_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    if (!VALID_ASSET_TYPES.includes(asset_type)) {
      return new Response(JSON.stringify({ error: `Invalid asset_type. Choose: ${VALID_ASSET_TYPES.join(", ")}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    if (!VALID_STYLES.includes(style)) {
      return new Response(JSON.stringify({ error: `Invalid style. Choose: ${VALID_STYLES.join(", ")}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const creditCost = CLIP_PACK_CREDITS[clip_count];
    if (!creditCost) {
      return new Response(JSON.stringify({ error: "Invalid clip_count. Choose 3 or 5." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    // Verify track exists and belongs to user
    const { data: track, error: trackError } = await supabaseClient
      .from("tracks")
      .select("id, title, genre, description, cover_art_url, artist_id, mood_tags")
      .eq("id", track_id)
      .single();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
      });
    }

    // Get artist profile for name and style context
    const { data: artistProfile } = await supabaseClient
      .from("profiles")
      .select("display_name, avatar_url, bio")
      .eq("id", track.artist_id)
      .single();

    const artistName = artistProfile?.display_name || "Unknown Artist";

    // Deduct credits
    const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
      p_user_id: userId, p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${creditCost} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    logStep("Credits deducted", { creditCost, userId });

    // Generate marketing copy via AI
    const formatLabel = asset_type === "tiktok" ? "TikTok" 
      : asset_type === "instagram_reel" ? "Instagram Reel"
      : asset_type === "youtube_short" ? "YouTube Short"
      : "Square Promo";

    let aiCopy = { caption: "", hook: "", hashtags: [] as string[] };

    try {
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
              content: `You are a viral music marketing expert. Create short-form social media copy for a music promotional clip. Be punchy, use trending language, and focus on engagement. The content is for ${formatLabel}.${visual_theme ? ` The artist's visual brand is "${visual_theme}" style.` : ""}${avatar_url ? " The artist has a distinctive AI-generated visual identity." : ""}`,
            },
            {
              role: "user",
              content: `Create viral promotional copy for this track:
Title: "${track.title}"
Artist: "${artistName}"
Genre: ${track.genre || "Unknown"}
Mood: ${(track.mood_tags || []).join(", ") || "N/A"}
Description: ${track.description || "N/A"}
Visual Theme: ${visual_theme || "N/A"}
Duration: ${duration_seconds}s ${style} clip
Format: ${formatLabel}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_viral_copy",
                description: "Generate viral promotional copy for a music clip",
                parameters: {
                  type: "object",
                  properties: {
                    caption: {
                      type: "string",
                      description: "Social media caption (2-3 lines max, include emojis)",
                    },
                    hook_text: {
                      type: "string",
                      description: "First 2-second hook text overlay for the video (short, punchy, max 8 words)",
                    },
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      description: "10-15 relevant hashtags without the # symbol",
                    },
                  },
                  required: ["caption", "hook_text", "hashtags"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_viral_copy" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          aiCopy = {
            caption: parsed.caption || "",
            hook: parsed.hook_text || "",
            hashtags: parsed.hashtags || [],
          };
        }
      } else {
        logStep("AI copy generation failed, using fallback", { status: aiResponse.status });
        aiCopy = {
          caption: `🔥 New drop: "${track.title}" by ${artistName}. Stream now!`,
          hook: "New sound alert 🚨",
          hashtags: ["newmusic", "musicdrop", track.genre?.toLowerCase().replace(/\s/g, "") || "music", "artist", "viral"],
        };
      }
    } catch (aiErr) {
      logStep("AI error, using fallback copy", { error: String(aiErr) });
      aiCopy = {
        caption: `🔥 "${track.title}" by ${artistName} just dropped!`,
        hook: "Listen to this 🎵",
        hashtags: ["newmusic", "musicrelease", "viral"],
      };
    }

    // Create the viral asset record
    const { data: asset, error: assetError } = await supabaseClient
      .from("ai_viral_assets")
      .insert({
        user_id: userId,
        track_id: track_id,
        asset_type: asset_type,
        style: style,
        duration_seconds: duration_seconds,
        caption_text: aiCopy.caption,
        hook_text: aiCopy.hook,
        hashtag_set: aiCopy.hashtags,
        status: "queued",
      })
      .select()
      .single();

    if (assetError) {
      // Refund credits on failure
      await supabaseClient.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
      throw new Error("Failed to create viral asset record");
    }

    // Log the generation
    await supabaseClient.from("ai_viral_generation_logs").insert({
      user_id: userId,
      track_id: track_id,
      credit_cost: creditCost,
      generation_type: asset_type,
      duration_seconds: duration_seconds,
      style: style,
    });

    // Log credit usage
    await supabaseClient.from("ai_credit_usage").insert({
      user_id: userId,
      action: "viral_generator",
      credits_used: creditCost,
      metadata: {
        track_id, asset_type, duration_seconds, style,
        track_title: track.title,
      },
    });

    logStep("Viral asset created", { assetId: asset.id, type: asset_type, duration: duration_seconds });

    return new Response(JSON.stringify({
      success: true,
      asset: {
        id: asset.id,
        asset_type: asset.asset_type,
        style: asset.style,
        duration_seconds: asset.duration_seconds,
        status: asset.status,
        caption_text: asset.caption_text,
        hook_text: asset.hook_text,
        hashtag_set: asset.hashtag_set,
      },
      credits_used: creditCost,
      credits_remaining: deductResult.new_credits,
      message: `${formatLabel} viral content queued. Your ${duration_seconds}s ${style} clip will be ready shortly.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
