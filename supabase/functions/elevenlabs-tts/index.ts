import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { text, voiceId } = await req.json();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "nPczCjzI2devNBz1zQrb"}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
          speed: 0.9,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    return new Response(JSON.stringify({ error: errText }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const audioBuffer = await response.arrayBuffer();
  
  // Return as base64 in JSON since we need to handle this in scripts
  const uint8 = new Uint8Array(audioBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  return new Response(JSON.stringify({ audio_base64: base64, size: audioBuffer.byteLength }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
