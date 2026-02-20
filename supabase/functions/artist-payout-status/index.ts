import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ARTIST-PAYOUT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Get user profile with Stripe Connect info
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_account_status, stripe_payouts_enabled")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Get earnings summary
    const { data: earnings, error: earningsError } = await supabaseClient
      .from("artist_earnings")
      .select("*")
      .eq("artist_id", userId);

    if (earningsError) {
      logStep("Error fetching earnings", { error: earningsError.message });
    }

    // Calculate totals
    const allEarnings = earnings || [];
    const pendingEarnings = allEarnings
      .filter(e => e.status === "pending")
      .reduce((sum, e) => sum + e.artist_payout_cents, 0);
    
    const paidEarnings = allEarnings
      .filter(e => e.status === "paid")
      .reduce((sum, e) => sum + e.artist_payout_cents, 0);
    
    const totalEarnings = allEarnings.reduce((sum, e) => sum + e.artist_payout_cents, 0);

    logStep("Earnings calculated", { 
      pending_cents: pendingEarnings, 
      paid_cents: paidEarnings,
      total_cents: totalEarnings,
    });

    // Get recent earnings (last 10)
    const recentEarnings = allEarnings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    // Check Stripe Connect account status if account exists
    let stripeAccountDetails = null;
    if (profile.stripe_account_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-11-17.clover",
        });

        const account = await stripe.accounts.retrieve(profile.stripe_account_id);
        
        stripeAccountDetails = {
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          requirements: account.requirements?.currently_due || [],
        };

        // Update profile if status has changed
        const newStatus = account.details_submitted 
          ? (account.payouts_enabled ? "active" : "restricted")
          : "pending";
        
        if (newStatus !== profile.stripe_account_status || 
            account.payouts_enabled !== profile.stripe_payouts_enabled) {
          await supabaseClient
            .from("profiles")
            .update({
              stripe_account_status: newStatus,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq("id", userId);
          
          logStep("Profile updated with new Stripe status", { 
            status: newStatus, 
            payouts_enabled: account.payouts_enabled 
          });
        }

        logStep("Stripe account retrieved", { 
          details_submitted: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
        });
      } catch (stripeError) {
        logStep("Error fetching Stripe account", { 
          error: stripeError instanceof Error ? stripeError.message : "Unknown" 
        });
      }
    }

    return new Response(
      JSON.stringify({
        stripe_connected: !!profile.stripe_account_id,
        stripe_account_status: profile.stripe_account_status,
        stripe_payouts_enabled: profile.stripe_payouts_enabled,
        stripe_account_details: stripeAccountDetails,
        pending_earnings_cents: pendingEarnings,
        paid_earnings_cents: paidEarnings,
        total_earnings_cents: totalEarnings,
        recent_earnings: recentEarnings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
