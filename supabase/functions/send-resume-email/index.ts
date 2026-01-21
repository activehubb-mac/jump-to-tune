import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const LOGO_URL = "https://jump-to-tune.lovable.app/images/jumtunes-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResumeEmailRequest {
  userId: string;
  tier: string;
  resumedAt: string;
  wasAutomatic: boolean;
}

const getTierName = (tier: string) => {
  switch (tier) {
    case "artist": return "Artist Plan";
    case "label": return "Label Plan";
    default: return "Fan Plan";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-resume-email: Starting...");

    const { userId, tier, resumedAt, wasAutomatic }: ResumeEmailRequest = await req.json();
    console.log("send-resume-email: Processing for user", userId, "tier:", tier, "automatic:", wasAutomatic);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user email from auth
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      console.error("send-resume-email: Failed to get user email", userError);
      throw new Error("Could not find user email");
    }

    // Get display name from profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const email = userData.user.email;
    const displayName = profile?.display_name || "there";
    const planName = getTierName(tier);

    const resumeDate = new Date(resumedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = wasAutomatic 
      ? `Your ${planName} is back! Pause period ended`
      : `Welcome back! Your ${planName} is active again`;

    const introText = wasAutomatic
      ? `Great news! Your pause period has ended and your <strong>${planName}</strong> is now active again as of ${resumeDate}.`
      : `Welcome back! You've resumed your <strong>${planName}</strong> as of ${resumeDate}.`;

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [email],
      subject,
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
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; text-align: center;">Welcome Back, ${displayName}!</h2>
              
              <p style="color: #4b5563; font-size: 16px; text-align: center;">
                ${introText}
              </p>

              <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="color: #065f46; font-weight: 600; margin: 0 0 8px 0;">✨ All your features are restored!</p>
                <p style="color: #047857; margin: 0; font-size: 14px;">
                  Your subscription is now active and billing has resumed.
                </p>
              </div>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Explore JumTunes
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Need help? Just reply to this email - we're here for you!
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

    console.log("send-resume-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-resume-email: Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
