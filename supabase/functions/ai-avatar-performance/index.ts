import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trackId, trackTitle, artistName, avatarStyle, sceneBackground, avatarPrompt, scenePrompt, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Create a detailed visual description for an AI-generated music performance video thumbnail/poster.

The performance features: ${avatarPrompt}
The setting is: ${scenePrompt}
The song is "${trackTitle}" by ${artistName}.

Generate a vivid, detailed image prompt that captures the energy of a live music performance. Include the artist name "${artistName}" and song title "${trackTitle}" as text overlays. Add a "JumTunes.com" watermark at the bottom.

Style: ${avatarStyle.replace(/_/g, " ")}
Scene: ${sceneBackground.replace(/_/g, " ")}

The image should be vertical (9:16 aspect ratio) and optimized for social media sharing.`;

    // Use image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "system",
            content: "You are an AI image generator. Create a stunning vertical music performance poster/thumbnail image based on the user's description. The image should be vibrant, dynamic, and suitable for social media sharing."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Insufficient AI credits in workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    // Check if there's inline image data
    const inlineImages = result.choices?.[0]?.message?.inline_images;
    if (inlineImages && inlineImages.length > 0) {
      // Store to Supabase storage
      const imageData = inlineImages[0];
      const base64Data = imageData.data;
      const mimeType = imageData.mime_type || "image/png";

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const fileName = `${userId}/${Date.now()}_ai_avatar_${avatarStyle}.png`;
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const uploadResp = await fetch(`${SUPABASE_URL}/storage/v1/object/go-dj-mix-renders/${fileName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": mimeType,
          "x-upsert": "true",
        },
        body: binaryData,
      });

      if (!uploadResp.ok) {
        console.error("Upload failed:", await uploadResp.text());
        throw new Error("Failed to upload generated image");
      }

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/go-dj-mix-renders/${fileName}`;

      return new Response(JSON.stringify({ imageUrl, content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return text content description
    return new Response(JSON.stringify({
      content,
      message: "AI avatar visual description generated. Image generation is being processed.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-avatar-performance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
