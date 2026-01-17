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

interface SaleEmailRequest {
  recipientId: string;
  recipientType: "artist" | "label";
  trackTitle: string;
  trackId: string;
  coverArtUrl: string | null;
  editionNumber: number;
  totalEditions: number;
  grossAmountCents: number;
  earningsCents: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-sale-email: Starting...");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { 
      recipientId, 
      recipientType,
      trackTitle, 
      trackId,
      coverArtUrl, 
      editionNumber,
      totalEditions,
      grossAmountCents,
      earningsCents 
    }: SaleEmailRequest = await req.json();

    console.log("send-sale-email: Sale notification for", recipientType, recipientId);

    // Get recipient email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(recipientId);
    if (userError || !userData?.user?.email) {
      console.error("send-sale-email: Error fetching user email", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile for name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", recipientId)
      .single();

    const recipientEmail = userData.user.email;
    const recipientName = profile?.display_name || (recipientType === "label" ? "Label Owner" : "Artist");
    const salePrice = (grossAmountCents / 100).toFixed(2);
    const earnings = (earningsCents / 100).toFixed(2);
    const platformFee = ((grossAmountCents - earningsCents) / 100).toFixed(2);
    const editionsRemaining = totalEditions - editionNumber;
    const defaultCover = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop";

    console.log("send-sale-email: Sending to", recipientEmail);

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [recipientEmail],
      subject: `🎉 New Sale! "${trackTitle}" - Edition #${editionNumber} sold!`,
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
                <span style="font-size: 48px;">🎉</span>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                Cha-ching, ${recipientName}!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; text-align: center;">
                Someone just purchased your track! Here are the details:
              </p>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 80px; vertical-align: top;">
                      <img src="${coverArtUrl || defaultCover}" alt="${trackTitle}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover;">
                    </td>
                    <td style="vertical-align: top; padding-left: 12px;">
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${trackTitle}</p>
                      <p style="margin: 8px 0 0 0; color: #7c3aed; font-size: 14px; font-weight: 600;">
                        Edition #${editionNumber} of ${totalEditions}
                      </p>
                      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
                        ${editionsRemaining} editions remaining
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px;">Your Earnings</p>
                <p style="margin: 8px 0 0 0; color: white; font-size: 32px; font-weight: 700;">+$${earnings}</p>
              </div>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; padding: 4px 0;">Sale Price</td>
                    <td style="color: #1f2937; text-align: right; font-weight: 500;">$${salePrice}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 4px 0;">Platform Fee (15%)</td>
                    <td style="color: #6b7280; text-align: right;">-$${platformFee}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="color: #059669; padding: 8px 0 0 0; font-weight: 600;">Your Earnings (85%)</td>
                    <td style="color: #059669; text-align: right; font-weight: 600; padding: 8px 0 0 0;">$${earnings}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://jump-to-tune.lovable.app/${recipientType}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Dashboard
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Keep creating amazing music! Your earnings will be available for payout once you've set up Stripe Connect.
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

    console.log("send-sale-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-sale-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
