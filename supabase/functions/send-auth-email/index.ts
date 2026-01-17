import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0?bundle";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Get the full secret and strip v1, and whsec_ prefixes
// The Webhook library expects raw Base64 only, not the prefixed format from Supabase
const fullSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
const hookSecret = fullSecret
  .replace("v1,", "")
  .replace("whsec_", "");

console.log("Hook secret processing:", {
  originalLength: fullSecret.length,
  cleanedLength: hookSecret.length,
  hasV1Prefix: fullSecret.includes("v1,"),
  hasWhsecPrefix: fullSecret.includes("whsec_")
});

const LOGO_URL = "https://jump-to-tune.lovable.app/images/jumtunes-logo.png";

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const getEmailContent = (type: string, displayName: string, actionUrl: string) => {
  const name = displayName || "there";
  
  switch (type) {
    case "signup":
      return {
        subject: "🎵 Confirm your JumTunes account",
        heading: "Welcome to JumTunes!",
        greeting: `Hey ${name}! 👋`,
        message: "Thanks for joining JumTunes! To get started, please confirm your email address.",
        ctaText: "Verify Email",
        ctaUrl: actionUrl,
        footer: "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
        features: [
          "Browse and discover unique music",
          "Purchase tracks and own them forever",
          "Support your favorite artists directly"
        ]
      };
    case "recovery":
    case "magiclink":
      return {
        subject: "🔐 Reset your JumTunes password",
        heading: "Reset Your Password",
        greeting: `Hey ${name}!`,
        message: "We received a request to reset your password. Click the button below to create a new password.",
        ctaText: "Reset Password",
        ctaUrl: actionUrl,
        footer: "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.",
        features: []
      };
    case "email_change":
      return {
        subject: "📧 Confirm your new email address",
        heading: "Confirm Email Change",
        greeting: `Hey ${name}!`,
        message: "Please confirm your new email address by clicking the button below.",
        ctaText: "Confirm Email",
        ctaUrl: actionUrl,
        footer: "If you didn't request this change, please contact support immediately.",
        features: []
      };
    case "invite":
      return {
        subject: "🎵 You've been invited to JumTunes!",
        heading: "You're Invited!",
        greeting: `Hey ${name}! 👋`,
        message: "You've been invited to join JumTunes. Click below to accept your invitation and set up your account.",
        ctaText: "Accept Invitation",
        ctaUrl: actionUrl,
        footer: "This invitation link expires in 7 days.",
        features: [
          "Browse and discover unique music",
          "Purchase tracks and own them forever",
          "Support your favorite artists directly"
        ]
      };
    default:
      return {
        subject: "🎵 Action required for your JumTunes account",
        heading: "Action Required",
        greeting: `Hey ${name}!`,
        message: "Please click the button below to complete your action.",
        ctaText: "Continue",
        ctaUrl: actionUrl,
        footer: "If you didn't request this, you can safely ignore this email.",
        features: []
      };
  }
};

const generateEmailHtml = (content: ReturnType<typeof getEmailContent>) => {
  const featuresHtml = content.features.length > 0 
    ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #f8f5ff; border-radius: 8px;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a2e;">Once verified, you'll be able to:</p>
        <ul style="margin: 0; padding-left: 20px; color: #4a4a6a;">
          ${content.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
          <tr>
            <td align="center" style="padding: 15px 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%); padding: 24px 20px; text-align: center;">
                    <img src="${LOGO_URL}" alt="JumTunes" style="width: 180px; height: auto; display: block; margin: 0 auto;">
                    <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Own Your Music
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 24px 20px;">
                    <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-weight: 600;">
                      ${content.heading}
                    </h2>
                    <p style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 16px; line-height: 1.5;">
                      ${content.greeting}
                    </p>
                    <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 16px; line-height: 1.6;">
                      ${content.message}
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
                          <a href="${content.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                            ${content.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    ${featuresHtml}
                    
                    <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                      ${content.footer}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f5ff; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                      © ${new Date().getFullYear()} JumTunes. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      You're receiving this email because you signed up for JumTunes.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let data: AuthEmailPayload;
  
  try {
    if (!hookSecret) {
      console.error("SEND_EMAIL_HOOK_SECRET is empty or not configured");
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: "Hook secret not configured" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const wh = new Webhook(hookSecret);
    data = wh.verify(payload, headers) as AuthEmailPayload;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: "Unauthorized" } }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { user, email_data } = data;
  const displayName = user.user_metadata?.display_name || "";
  
  // Build the verification URL
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const actionUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;
  
  const emailContent = getEmailContent(email_data.email_action_type, displayName, actionUrl);
  const html = generateEmailHtml(emailContent);

  try {
    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [user.email],
      subject: emailContent.subject,
      html,
    });

    console.log("Auth email sent successfully:", {
      type: email_data.email_action_type,
      to: user.email,
      response: emailResponse
    });

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: error.message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
