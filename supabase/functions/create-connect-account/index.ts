import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";

    // Check if user already has a Connect account
    if (profile.stripe_account_id) {
      logStep("User already has Connect account, creating login link", { 
        account_id: profile.stripe_account_id 
      });

      try {
        // Check account status
        const account = await stripe.accounts.retrieve(profile.stripe_account_id);
        
        if (account.details_submitted) {
          // Account is complete, create login link to dashboard
          const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
          return new Response(
            JSON.stringify({ 
              url: loginLink.url,
              account_status: "active",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } else {
          // Account exists but onboarding not complete, create new onboarding link
          const accountLink = await stripe.accountLinks.create({
            account: profile.stripe_account_id,
            refresh_url: `${origin}/artist/payouts?refresh=true`,
            return_url: `${origin}/artist/payouts?success=true`,
            type: "account_onboarding",
          });

          return new Response(
            JSON.stringify({ 
              url: accountLink.url,
              account_status: "pending",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      } catch (accountError) {
        logStep("Error retrieving existing account, creating new one", { 
          error: accountError instanceof Error ? accountError.message : "Unknown" 
        });
      }
    }

    // Create new Stripe Connect Express account
    logStep("Creating new Connect Express account");

    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Default to US, can be changed during onboarding
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        user_id: user.id,
        platform: "jumtunes",
      },
    });

    logStep("Connect account created", { account_id: account.id });

    // Update profile with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        stripe_account_status: "pending",
        stripe_payouts_enabled: false,
      })
      .eq("id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update profile", { error: updateError.message });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/artist/payouts?refresh=true`,
      return_url: `${origin}/artist/payouts?success=true`,
      type: "account_onboarding",
    });

    logStep("Account link created", { url: accountLink.url });

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        account_id: account.id,
        account_status: "pending",
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
