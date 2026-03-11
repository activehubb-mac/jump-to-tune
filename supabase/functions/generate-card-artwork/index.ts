import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { card_id, prompt } = await req.json();
    if (!card_id || !prompt) {
      return new Response(JSON.stringify({ error: "card_id and prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storagePath = `card-artwork/${card_id}.png`;

    // Check if already cached in storage
    const { data: existingFile } = await supabase.storage.from("covers").list("card-artwork", {
      search: `${card_id}.png`,
    });

    if (existingFile && existingFile.length > 0) {
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(storagePath);
      console.log(`[CARD-ART] Cache hit for ${card_id}`);
      return new Response(JSON.stringify({ image_url: urlData.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate via AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log(`[CARD-ART] Generating artwork for ${card_id}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error(`[CARD-ART] AI error ${status}: ${body}`);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI generation failed: ${status}`);
    }

    const aiData = await aiResponse.json();
    const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!base64Url) throw new Error("No image returned from AI");

    // Extract base64 data after the prefix
    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = base64ToUint8Array(base64Data);

    // Upload to storage
    const { error: uploadError } = await supabase.storage.from("covers").upload(storagePath, imageBytes, {
      contentType: "image/png",
      upsert: true,
    });

    if (uploadError) {
      console.error(`[CARD-ART] Upload error:`, uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(storagePath);
    console.log(`[CARD-ART] Generated and cached ${card_id}`);

    return new Response(JSON.stringify({ image_url: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CARD-ART] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
