import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const LOGO_URL = "https://jump-to-tune.lovable.app/images/jumtunes-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  artistId: string;
  labelId: string;
  labelName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-invite-email: Starting...");

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("send-invite-email: No auth header");
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

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("send-invite-email: Invalid token", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { artistId, labelId, labelName }: InviteEmailRequest = await req.json();
    console.log("send-invite-email: Sending invite from", labelName, "to artist", artistId);

    // Get the artist's email from auth.users via a service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get artist profile for display name
    const { data: artistProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", artistId)
      .single();

    if (profileError) {
      console.error("send-invite-email: Error fetching artist profile", profileError);
      return new Response(
        JSON.stringify({ error: "Artist not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get artist email from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(artistId);

    if (userError || !userData?.user?.email) {
      console.error("send-invite-email: Error fetching artist email", userError);
      return new Response(
        JSON.stringify({ error: "Artist email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const artistEmail = userData.user.email;
    const artistName = artistProfile.display_name || "Artist";

    console.log("send-invite-email: Sending email to", artistEmail);

    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [artistEmail],
      subject: `${labelName} wants to add you to their roster!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 15px 10px; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 24px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <img src="${LOGO_URL}" alt="JumTunes" style="width: 180px; height: auto; display: block; margin: 0 auto;">
            </div>
            
            <div style="background: #ffffff; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hey ${artistName}! 👋</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Great news! <strong>${labelName}</strong> wants to add you to their label roster on JumTunes.
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                Once you accept this invitation, ${labelName} will be able to:
              </p>
              
              <ul style="color: #4b5563; font-size: 16px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Upload and release music on your behalf</li>
                <li style="margin-bottom: 8px;">Manage pricing and distribution for your tracks</li>
                <li style="margin-bottom: 8px;">Handle all the business stuff so you can focus on creating</li>
              </ul>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/artist/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Log in to your JumTunes artist dashboard to accept or decline this invitation.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.<br>
                © ${new Date().getFullYear()} JumTunes. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("send-invite-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-invite-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
