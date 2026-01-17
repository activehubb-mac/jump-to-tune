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

interface PayoutEmailRequest {
  artistId: string;
  payoutAmountCents: number;
  status: "paid" | "failed";
  failureReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-payout-email: Starting...");

    const { artistId, payoutAmountCents, status, failureReason }: PayoutEmailRequest = await req.json();
    console.log("send-payout-email: Payout", status, "for artist", artistId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get artist email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(artistId);
    if (userError || !userData?.user?.email) {
      console.error("send-payout-email: Error fetching artist email", userError);
      return new Response(
        JSON.stringify({ error: "Artist email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get artist profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", artistId)
      .single();

    const artistEmail = userData.user.email;
    const artistName = profile?.display_name || "Artist";
    const payoutAmount = (payoutAmountCents / 100).toFixed(2);

    console.log("send-payout-email: Sending to", artistEmail);

    const isPaid = status === "paid";
    const subject = isPaid 
      ? `💰 Your payout of $${payoutAmount} is on its way!`
      : `⚠️ Payout issue - Action required`;

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [artistEmail],
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
            </div>
            
            <div style="background: #ffffff; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              ${isPaid ? `
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 48px;">💰</span>
                </div>
                
                <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                  Cha-ching, ${artistName}!
                </h2>
                
                <p style="color: #4b5563; font-size: 16px; text-align: center;">
                  Great news! Your earnings are being transferred to your bank account.
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="color: #166534; margin: 0 0 8px 0; font-size: 14px;">Payout Amount</p>
                  <p style="color: #166534; margin: 0; font-size: 32px; font-weight: 700;">$${payoutAmount}</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Funds typically arrive within 2-3 business days, depending on your bank.
                </p>
              ` : `
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 48px;">⚠️</span>
                </div>
                
                <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                  Payout Issue, ${artistName}
                </h2>
                
                <p style="color: #4b5563; font-size: 16px; text-align: center;">
                  We encountered an issue processing your payout of <strong>$${payoutAmount}</strong>.
                </p>
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <p style="color: #991b1b; margin: 0; font-size: 14px;">
                    <strong>Reason:</strong> ${failureReason || "There was an issue with your connected bank account."}
                  </p>
                </div>
                
                <p style="color: #4b5563; font-size: 14px;">
                  To resolve this, please check your Stripe Connect account settings and ensure your bank details are correct and verified.
                </p>
              `}
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/artist/payouts" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${isPaid ? "View Payout History" : "Fix Payout Settings"}
                </a>
              </div>
              
              ${isPaid ? `
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Keep creating amazing music - your fans are waiting! 🎶
                </p>
              ` : `
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Need help? Reply to this email and we'll assist you.
                </p>
              `}
              
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

    console.log("send-payout-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-payout-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
