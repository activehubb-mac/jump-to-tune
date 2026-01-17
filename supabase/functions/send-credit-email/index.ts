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

interface CreditEmailRequest {
  userId: string;
  amountCents: number;
  feeCents: number;
  newBalanceCents: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-credit-email: Starting...");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, amountCents, feeCents, newBalanceCents }: CreditEmailRequest = await req.json();

    console.log("send-credit-email: Credit purchase for user", userId, "amount:", amountCents);

    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error("send-credit-email: Error fetching user email", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const userEmail = userData.user.email;
    const userName = profile?.display_name || "there";
    const creditAmount = (amountCents / 100).toFixed(2);
    const feeAmount = (feeCents / 100).toFixed(2);
    const totalPaid = ((amountCents + feeCents) / 100).toFixed(2);
    const newBalance = (newBalanceCents / 100).toFixed(2);

    console.log("send-credit-email: Sending to", userEmail);

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [userEmail],
      subject: `💰 $${creditAmount} credits added to your JumTunes wallet!`,
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
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">💰</span>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                Credits Added, ${userName}!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; text-align: center;">
                Your wallet has been topped up and you're ready to collect more music.
              </p>
              
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px;">Credits Added</p>
                <p style="margin: 8px 0 0 0; color: white; font-size: 32px; font-weight: 700;">$${creditAmount}</p>
              </div>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; padding: 4px 0;">Credits</td>
                    <td style="color: #1f2937; text-align: right; font-weight: 500;">$${creditAmount}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 4px 0;">Processing Fee (1%)</td>
                    <td style="color: #6b7280; text-align: right;">$${feeAmount}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="color: #1f2937; padding: 8px 0 0 0; font-weight: 600;">Total Charged</td>
                    <td style="color: #1f2937; text-align: right; font-weight: 600; padding: 8px 0 0 0;">$${totalPaid}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">New Wallet Balance</p>
                <p style="margin: 4px 0 0 0; color: #7c3aed; font-size: 24px; font-weight: 700;">$${newBalance}</p>
              </div>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/browse" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Browse Music
                </a>
              </div>
              
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

    console.log("send-credit-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-credit-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
