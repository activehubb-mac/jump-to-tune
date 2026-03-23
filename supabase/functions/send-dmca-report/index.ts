import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, content_url, reason, description } = await req.json();

    if (!name || !email || !content_url || !reason) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("dmca_reports").insert({
      name,
      email,
      content_url,
      reason,
      description: description || null,
    });

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to store report");
    }

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailHtml = `
      <h2>DMCA / Content Report</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Content URL</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="${escapeHtml(content_url)}">${escapeHtml(content_url)}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Reason</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(reason)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Description</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(description || "N/A")}</td></tr>
      </table>
      <p style="margin-top:20px;color:#666;font-size:12px;">Submitted at ${new Date().toISOString()}</p>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JumTunes Reports <onboarding@resend.dev>",
        to: ["dmca@jumtunes.com"],
        subject: `DMCA Report: ${reason} — ${name}`,
        html: emailHtml,
        reply_to: email,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      // Don't fail the request - report is already stored in DB
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
