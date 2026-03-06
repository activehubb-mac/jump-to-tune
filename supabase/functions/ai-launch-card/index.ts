import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-LAUNCH-CARD] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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

    const { track_title, artist_name, cover_art_url } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Generate shareable launch card image
    const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: `Generate a bold 16:9 social media announcement graphic for a new music release. Style: futuristic, vibrant gradients, neon accents. Text overlay: "🔥 New AI Artist Launched" at top, artist name "${artist_name || "Artist"}" in large bold text, track title "${track_title || "New Release"}" below, "Platform: JumTunes" at bottom. Make it eye-catching and shareable. Modern music industry aesthetic.`,
        }],
        modalities: ["image", "text"],
      }),
    });

    let launchCardImage = null;
    if (imgResp.ok) {
      const imgData = await imgResp.json();
      launchCardImage = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
    }

    // Generate social copy
    const copyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Generate social media copy for a music launch. Call generate_social_copy." },
          { role: "user", content: `Artist: ${artist_name}. Track: ${track_title}. Platform: JumTunes.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_social_copy",
            description: "Generate social media copy for multiple platforms",
            parameters: {
              type: "object",
              properties: {
                instagram: { type: "string", description: "Instagram caption with emojis and hashtags" },
                twitter: { type: "string", description: "X/Twitter post (under 280 chars)" },
                tiktok: { type: "string", description: "TikTok caption" },
              },
              required: ["instagram", "twitter", "tiktok"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_social_copy" } },
      }),
    });

    let socialCopy = { instagram: "", twitter: "", tiktok: "" };
    if (copyResp.ok) {
      const copyData = await copyResp.json();
      const tc = copyData.choices?.[0]?.message?.tool_calls?.[0];
      if (tc?.function?.arguments) {
        try { socialCopy = JSON.parse(tc.function.arguments); } catch {}
      }
    }

    logStep("Launch card generated");

    return new Response(JSON.stringify({
      launch_card_image: launchCardImage,
      social_copy: socialCopy,
      artist_name,
      track_title,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
