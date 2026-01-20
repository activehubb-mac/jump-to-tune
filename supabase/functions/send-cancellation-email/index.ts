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

interface CancellationEmailRequest {
  userId: string;
  tier: string;
  canceledAt: string;
  periodEnd?: string;
}

const getTierContent = (tier: string) => {
  switch (tier) {
    case "artist":
      return {
        planName: "Artist Plan",
        featuresLost: [
          "Upload new tracks",
          "Artist analytics dashboard",
          "Earnings from tips",
        ],
        featuresKept: [
          "Your existing tracks remain live",
          "Previous earnings are unaffected",
          "Your profile stays visible",
        ],
      };
    case "label":
      return {
        planName: "Label Plan",
        featuresLost: [
          "Manage artist roster",
          "Label analytics dashboard",
          "Upload on behalf of artists",
        ],
        featuresKept: [
          "Your existing catalog remains live",
          "Previous earnings are unaffected",
          "Your label profile stays visible",
        ],
      };
    default:
      return {
        planName: "Fan Plan",
        featuresLost: [
          "Unlimited streaming",
          "Download to collection",
          "High-quality downloads",
        ],
        featuresKept: [
          "Previously purchased tracks are yours forever",
          "Your collection remains accessible",
          "Your profile stays active",
        ],
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-cancellation-email: Starting...");

    const { userId, tier, canceledAt, periodEnd }: CancellationEmailRequest = await req.json();
    console.log("send-cancellation-email: Processing for user", userId, "tier:", tier);

    // Get user info from Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user email from auth
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      console.error("send-cancellation-email: Failed to get user email", userError);
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
    const content = getTierContent(tier);

    const cancelDate = new Date(canceledAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const accessEndDate = periodEnd 
      ? new Date(periodEnd).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : cancelDate;

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [email],
      subject: `Your ${content.planName} has been canceled`,
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
              <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hey ${displayName},</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                We're sorry to see you go! Your <strong>${content.planName}</strong> has been canceled as of ${cancelDate}.
              </p>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; font-weight: 600; margin: 0 0 4px 0;">⏰ Access Until</p>
                <p style="color: #78350f; margin: 0;">Your subscription remains active until <strong>${accessEndDate}</strong></p>
              </div>
              
              <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #991b1b; font-weight: 600; margin: 0 0 12px 0;">What you'll lose access to:</p>
                <ul style="color: #dc2626; margin: 0; padding-left: 20px;">
                  ${content.featuresLost.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join("")}
                </ul>
              </div>

              <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #065f46; font-weight: 600; margin: 0 0 12px 0;">What stays with you:</p>
                <ul style="color: #047857; margin: 0; padding-left: 20px;">
                  ${content.featuresKept.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join("")}
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">Changed your mind?</h3>
              <p style="color: #4b5563; font-size: 14px; margin-bottom: 16px;">
                You can resubscribe anytime to regain full access to all features. Your profile and content are waiting for you!
              </p>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/subscription" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Resubscribe Now
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

    console.log("send-cancellation-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-cancellation-email: Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
