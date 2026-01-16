import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LowBalanceEmailRequest {
  userId: string;
  balanceCents: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-low-balance-email: Starting...");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, balanceCents }: LowBalanceEmailRequest = await req.json();

    console.log("send-low-balance-email: Low balance alert for user", userId, "balance:", balanceCents);

    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error("send-low-balance-email: Error fetching user email", userError);
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
    const balance = (balanceCents / 100).toFixed(2);

    console.log("send-low-balance-email: Sending to", userEmail);

    const emailResponse = await resend.emails.send({
      from: "JumTunes <noreply@send.jumtunes.com>",
      to: [userEmail],
      subject: `💳 Your JumTunes balance is running low ($${balance})`,
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
              <span style="font-size: 48px;">💳</span>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0; text-align: center;">
              Hey ${userName}, your balance is low
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; text-align: center;">
              Just a friendly heads-up that your credit balance is running low. Top up to keep collecting your favorite tracks!
            </p>
            
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Current Balance</p>
              <p style="margin: 8px 0 0 0; color: white; font-size: 36px; font-weight: 700;">$${balance}</p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Tip:</strong> Most tracks cost between $1-5. Top up now so you don't miss out on new releases from your favorite artists!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://jump-to-tune.lovable.app/wallet" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Top Up Now
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Credits never expire, so you can use them whenever you're ready.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              You're receiving this because you enabled low balance alerts.<br>
              © ${new Date().getFullYear()} JumTunes. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("send-low-balance-email: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-low-balance-email: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
