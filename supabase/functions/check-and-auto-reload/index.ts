import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AUTO-RELOAD] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Must match purchase-credits product→price mapping
const CREDIT_PACK_PRICES: Record<string, { priceId: string; credits: number; label: string }> = {
  "prod_U64QH9DtMPUYNi": { priceId: "price_1T7sHSEKeZaBsSwjc7RmfSqe", credits: 100, label: "100 AI Credits" },
  "prod_U64Scf2yEj3f3R": { priceId: "price_1T7sJdEKeZaBsSwjcJqdnD0V", credits: 500, label: "500 AI Credits" },
  "prod_U64VwSdypd7g5x": { priceId: "price_1T7sM6EKeZaBsSwjtCVk5uFi", credits: 2000, label: "2,000 AI Credits" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const user = userData.user;
    logStep("Checking auto-reload", { userId: user.id });

    // Fetch wallet with auto-reload settings
    const { data: wallet, error: walletError } = await supabaseClient
      .from("credit_wallets")
      .select("ai_credits, auto_reload_enabled, auto_reload_threshold, auto_reload_pack_product_id, auto_reload_pack_credits, auto_reload_last_triggered_at")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      logStep("No wallet found", { userId: user.id });
      return new Response(
        JSON.stringify({ triggered: false, reason: "no_wallet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if auto-reload is enabled
    if (!wallet.auto_reload_enabled) {
      return new Response(
        JSON.stringify({ triggered: false, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if credits are above threshold
    const currentCredits = Number(wallet.ai_credits) || 0;
    const threshold = wallet.auto_reload_threshold || 100;

    if (currentCredits >= threshold) {
      return new Response(
        JSON.stringify({ triggered: false, reason: "above_threshold", credits: currentCredits, threshold }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debounce: check if triggered within last 2 minutes
    if (wallet.auto_reload_last_triggered_at) {
      const lastTriggered = new Date(wallet.auto_reload_last_triggered_at).getTime();
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      if (lastTriggered > twoMinutesAgo) {
        logStep("Debounce active", { lastTriggered: wallet.auto_reload_last_triggered_at });
        return new Response(
          JSON.stringify({ triggered: false, reason: "debounce" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate pack
    const productId = wallet.auto_reload_pack_product_id;
    if (!productId || !CREDIT_PACK_PRICES[productId]) {
      logStep("Invalid pack configured", { productId });
      return new Response(
        JSON.stringify({ triggered: false, reason: "invalid_pack" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pack = CREDIT_PACK_PRICES[productId];
    logStep("Auto-reload triggered", { currentCredits, threshold, pack: pack.label });

    // Update last_triggered_at immediately to prevent concurrent triggers
    await supabaseClient
      .from("credit_wallets")
      .update({ auto_reload_last_triggered_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find Stripe customer
    if (!user.email) {
      throw new Error("No email on account");
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      // No Stripe customer = no saved payment method, can't charge off-session
      await logReload(supabaseClient, user.id, false, currentCredits, null, null, "No Stripe customer found");
      return new Response(
        JSON.stringify({ triggered: false, reason: "no_customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;

    // Check for default payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });

    if (paymentMethods.data.length === 0) {
      await logReload(supabaseClient, user.id, false, currentCredits, null, null, "No payment method on file");
      return new Response(
        JSON.stringify({ triggered: false, reason: "no_payment_method" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentMethodId = paymentMethods.data[0].id;

    // Create PaymentIntent off-session
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: getPackPrice(productId),
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          type: "ai_credit_pack",
          user_id: user.id,
          product_id: productId,
          ai_credits: pack.credits.toString(),
          auto_reload: "true",
        },
      });

      logStep("PaymentIntent created", { id: paymentIntent.id, status: paymentIntent.status });

      if (paymentIntent.status === "succeeded") {
        // Credits will be added by stripe-webhook when it processes this payment
        // We just log success here
        await logReload(supabaseClient, user.id, true, currentCredits, null, paymentIntent.id, null);

        return new Response(
          JSON.stringify({ triggered: true, status: "succeeded", credits: pack.credits }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await logReload(supabaseClient, user.id, false, currentCredits, null, paymentIntent.id, `Status: ${paymentIntent.status}`);

        return new Response(
          JSON.stringify({ triggered: true, status: paymentIntent.status }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (stripeError: any) {
      const msg = stripeError?.message || "Payment failed";
      logStep("Payment failed", { error: msg });
      await logReload(supabaseClient, user.id, false, currentCredits, null, null, msg);

      return new Response(
        JSON.stringify({ triggered: true, status: "failed", error: msg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function getPackPrice(productId: string): number {
  const prices: Record<string, number> = {
    "prod_U64QH9DtMPUYNi": 1000,  // $10
    "prod_U64Scf2yEj3f3R": 4000,  // $40
    "prod_U64VwSdypd7g5x": 9800,  // $98
  };
  return prices[productId] || 1000;
}

async function logReload(
  supabase: any,
  userId: string,
  success: boolean,
  creditsBefore: number | null,
  creditsAfter: number | null,
  stripeSessionId: string | null,
  errorMessage: string | null
) {
  try {
    await supabase.from("auto_reload_logs").insert({
      user_id: userId,
      success,
      credits_before: creditsBefore,
      credits_after: creditsAfter,
      stripe_session_id: stripeSessionId,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error("[AUTO-RELOAD] Failed to log:", e);
  }
}
