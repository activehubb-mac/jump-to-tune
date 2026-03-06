import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { track_id, audio_url } = await req.json();

    if (!track_id || !audio_url) {
      return new Response(
        JSON.stringify({ error: "track_id and audio_url required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify track ownership
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: track } = await adminClient
      .from("tracks")
      .select("artist_id, label_id")
      .eq("id", track_id)
      .single();

    if (!track || (track.artist_id !== user.id && track.label_id !== user.id)) {
      return new Response(
        JSON.stringify({ error: "Only track owners can generate lyrics" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download audio
    const audioResp = await fetch(audio_url);
    if (!audioResp.ok) throw new Error("Failed to fetch audio");
    const audioBlob = await audioResp.blob();

    // Call Whisper API
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("response_format", "srt");
    formData.append("timestamp_granularities[]", "segment");

    const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      console.error("Whisper error:", errText);
      return new Response(
        JSON.stringify({ error: "Transcription failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const srtText = await whisperResp.text();

    // Convert SRT to LRC format
    const lrcLines = srtToLRC(srtText);

    // Update track_karaoke lyrics
    await adminClient
      .from("track_karaoke")
      .update({ lyrics: lrcLines })
      .eq("track_id", track_id);

    return new Response(
      JSON.stringify({ success: true, lyrics: lrcLines }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("whisper-transcribe error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function srtToLRC(srt: string): string {
  const blocks = srt.trim().split(/\n\n+/);
  const lines: string[] = [];

  for (const block of blocks) {
    const parts = block.split("\n");
    if (parts.length < 3) continue;

    const timeLine = parts[1];
    const text = parts.slice(2).join(" ").trim();

    // Parse SRT timestamp: 00:01:23,456
    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) continue;

    const minutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const centis = Math.floor(parseInt(match[4]) / 10);

    lines.push(
      `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}]${text}`
    );
  }

  return lines.join("\n");
}
