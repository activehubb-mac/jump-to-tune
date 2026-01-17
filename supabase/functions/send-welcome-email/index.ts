import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const LOGO_URL = "https://jump-to-tune.lovable.app/images/jumtunes-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName: string;
  role: "fan" | "artist" | "label";
}

const getRoleContent = (role: string) => {
  switch (role) {
    case "artist":
      return {
        emoji: "🎤",
        title: "You're All Set, Artist!",
        description: "Your email is verified and your account is ready. Start uploading your music and connecting with fans who want to own your work.",
        features: [
          "Upload unlimited tracks with full ownership",
          "Set your own pricing and edition limits",
          "Receive 85% of all sales directly to your account",
          "Build your fanbase and track your analytics",
        ],
        cta: "Go to Artist Dashboard",
        ctaUrl: "https://jump-to-tune.lovable.app/artist/dashboard",
      };
    case "label":
      return {
        emoji: "🏢",
        title: "You're All Set, Label!",
        description: "Your email is verified and your account is ready. Start managing your roster and distributing music to a global audience.",
        features: [
          "Invite up to 5 artists to your roster",
          "Upload and manage releases on behalf of artists",
          "Centralized earnings and payout management",
          "Full analytics for your entire catalog",
        ],
        cta: "Go to Label Dashboard",
        ctaUrl: "https://jump-to-tune.lovable.app/label/dashboard",
      };
    default:
      return {
        emoji: "🎧",
        title: "You're All Set!",
        description: "Your email is verified and you're ready to discover unique music. Support artists directly and own your favorite tracks forever.",
        features: [
          "Browse and discover new music",
          "Purchase tracks and own them permanently",
          "Download in high quality formats",
          "Support your favorite artists directly",
        ],
        cta: "Start Exploring",
        ctaUrl: "https://jump-to-tune.lovable.app/browse",
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-welcome-email: Starting...");

    const { email, displayName, role }: WelcomeEmailRequest = await req.json();
    console.log("send-welcome-email: Sending to", email, "role:", role);

    const content = getRoleContent(role);
    const userName = displayName || "there";

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [email],
      subject: `${content.emoji} ${content.title}`,
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
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 14px;">Own Your Music</p>
            </div>
            
            <div style="background: #ffffff; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hey ${userName}! 🎉</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                ${content.description}
              </p>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #1f2937; font-weight: 600; margin: 0 0 12px 0;">Here's what you can do:</p>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  ${content.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join("")}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${content.ctaUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${content.cta}
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Just reply to this email - we're here to help!
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} JumTunes. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("send-welcome-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-welcome-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
