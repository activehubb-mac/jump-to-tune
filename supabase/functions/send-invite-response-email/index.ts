import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResponseEmailRequest {
  labelId: string;
  artistId: string;
  artistName: string;
  accepted: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-invite-response-email: Starting...");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("send-invite-response-email: No auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("send-invite-response-email: Invalid token", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { labelId, artistId, artistName, accepted }: ResponseEmailRequest = await req.json();
    console.log("send-invite-response-email:", artistName, accepted ? "accepted" : "declined");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get label email from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(labelId);

    if (userError || !userData?.user?.email) {
      console.error("send-invite-response-email: Error fetching label email", userError);
      return new Response(
        JSON.stringify({ error: "Label email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const labelEmail = userData.user.email;
    const status = accepted ? "accepted" : "declined";
    const statusEmoji = accepted ? "✅" : "❌";
    const statusColor = accepted ? "#10b981" : "#ef4444";

    console.log("send-invite-response-email: Sending email to", labelEmail);

    // Send the response email
    const emailResponse = await resend.emails.send({
      from: "JumTunes <notifications@resend.dev>",
      to: [labelEmail],
      subject: `${artistName} ${status} your roster invitation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎵 JumTunes</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">${statusEmoji}</span>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0; text-align: center;">
              Invitation ${accepted ? "Accepted" : "Declined"}
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; text-align: center;">
              <strong>${artistName}</strong> has <span style="color: ${statusColor}; font-weight: 600;">${status}</span> your invitation to join your label roster.
            </p>
            
            ${accepted ? `
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                <strong>🎉 Great news!</strong> You can now upload and release music on behalf of ${artistName}.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://jump-to-tune.lovable.app/label/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            ` : `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #991b1b; margin: 0; font-size: 14px;">
                The artist has chosen not to join your roster at this time. You can reach out to them directly if you'd like to discuss further.
              </p>
            </div>
            `}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} JumTunes. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("send-invite-response-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-invite-response-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
