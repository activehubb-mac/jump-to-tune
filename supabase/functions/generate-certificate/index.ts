import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to check ownership
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { track_id } = await req.json();
    if (!track_id) {
      return new Response(JSON.stringify({ error: "track_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to fetch data
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user owns this track
    const { data: track, error: trackError } = await supabaseAdmin
      .from("tracks")
      .select("id, title, artist_id, label_id")
      .eq("id", track_id)
      .single();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ownership
    const isOwner = track.artist_id === user.id || track.label_id === user.id;
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: "You don't own this track" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from("track_registrations")
      .select("*")
      .eq("track_id", track_id)
      .single();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ error: "No registration found for this track" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch artist/label profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", track.artist_id)
      .single();

    const artistName = profile?.display_name || "Unknown Artist";
    const uploadDate = new Date(registration.upload_timestamp).toUTCString();
    const certDate = new Date().toUTCString();

    // Generate HTML certificate
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #0a0a0a;
      color: #e0e0e0;
      width: 210mm;
      min-height: 297mm;
      padding: 40px;
    }
    .certificate {
      border: 2px solid #B8A675;
      border-radius: 16px;
      padding: 48px;
      min-height: calc(297mm - 80px);
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #141414 0%, #1e1e1e 50%, #141414 100%);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #B8A675;
      padding-bottom: 24px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      color: #B8A675;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 14px;
      color: #C9B98A;
      margin-top: 8px;
      letter-spacing: 2px;
    }
    .title-section {
      text-align: center;
      margin: 32px 0;
    }
    .cert-title {
      font-size: 28px;
      color: #f0f0f0;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .cert-desc {
      font-size: 13px;
      color: #888;
    }
    .details {
      margin: 32px 0;
      flex: 1;
    }
    .detail-row {
      display: flex;
      padding: 14px 0;
      border-bottom: 1px solid rgba(184, 166, 117, 0.15);
    }
    .detail-label {
      width: 200px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #B8A675;
      font-weight: bold;
    }
    .detail-value {
      flex: 1;
      font-size: 14px;
      color: #e0e0e0;
      word-break: break-all;
    }
    .hash-value {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #C9B98A;
    }
    .statement {
      margin-top: 32px;
      padding: 24px;
      border: 1px solid rgba(184, 166, 117, 0.3);
      border-radius: 8px;
      background: rgba(184, 166, 117, 0.05);
    }
    .statement p {
      font-size: 13px;
      line-height: 1.6;
      color: #ccc;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(184, 166, 117, 0.3);
    }
    .footer p {
      font-size: 11px;
      color: #666;
    }
    .recording-id-badge {
      display: inline-block;
      background: rgba(184, 166, 117, 0.2);
      border: 1px solid #B8A675;
      border-radius: 8px;
      padding: 8px 24px;
      font-size: 20px;
      font-weight: bold;
      color: #C9B98A;
      letter-spacing: 2px;
      margin: 16px 0;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo-text">JumTunes</div>
      <div class="subtitle">Verified Recording Certificate</div>
    </div>

    <div class="title-section">
      <div class="cert-title">${escapeHtml(track.title)}</div>
      <div class="cert-desc">by ${escapeHtml(artistName)}</div>
      <div class="recording-id-badge">${escapeHtml(registration.recording_id)}</div>
    </div>

    <div class="details">
      <div class="detail-row">
        <div class="detail-label">Recording ID</div>
        <div class="detail-value">${escapeHtml(registration.recording_id)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Track Title</div>
        <div class="detail-value">${escapeHtml(track.title)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Artist</div>
        <div class="detail-value">${escapeHtml(artistName)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Audio Fingerprint</div>
        <div class="detail-value hash-value">${escapeHtml(registration.audio_hash)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Upload Date (UTC)</div>
        <div class="detail-value">${escapeHtml(uploadDate)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Upload Region</div>
        <div class="detail-value">${escapeHtml(registration.country || "Unknown")}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Rights Declared</div>
        <div class="detail-value">${registration.rights_confirmed ? "Yes ✓" : "No"}</div>
      </div>
    </div>

    <div class="statement">
      <p>
        This certificate verifies that the above audio recording was uploaded to the JumTunes platform
        on <strong>${escapeHtml(uploadDate)}</strong>. The SHA-256 digital fingerprint uniquely identifies
        the original audio file. This document serves as a timestamped proof of upload and may be used
        as supporting evidence in intellectual property matters.
      </p>
    </div>

    <div class="footer">
      <p>Certificate generated on ${escapeHtml(certDate)}</p>
      <p>JumTunes — Own the Sound™</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="JumTunes-Certificate-${registration.recording_id}.html"`,
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate certificate" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
