import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PURCHASE-CREDITS] ${step}${detailsStr}`);
};

// Credit purchase tiers in cents
const CREDIT_TIERS = [500, 1000, 2500, 5000, 10000]; // $5, $10, $25, $50, $100
const MIN_CUSTOM_AMOUNT = 500; // Minimum $5 for custom amounts
const CREDIT_FEE_PERCENT = 1; // 1% fee on credit purchases

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

    const { amount_cents } = await req.json();
    
    // Validate amount
    if (!amount_cents || typeof amount_cents !== "number") {
      throw new Error("Invalid amount");
    }

    if (amount_cents < MIN_CUSTOM_AMOUNT) {
      throw new Error(`Minimum purchase amount is $${MIN_CUSTOM_AMOUNT / 100}`);
    }

    logStep("Purchase amount validated", { amount_cents });

    // Calculate credits after 1% fee
    const feeCents = Math.ceil(amount_cents * (CREDIT_FEE_PERCENT / 100));
    const creditsCents = amount_cents - feeCents;

    logStep("Fee calculated", { amount_cents, fee_cents: feeCents, credits_cents: creditsCents });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-11-17.clover",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
    
    // Detect if request is from mobile app
    const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
    const successBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    const cancelBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    
    logStep("URL configuration", { origin, isMobileApp, successBaseUrl });

    // Create checkout session for credit purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${(creditsCents / 100).toFixed(2)} Credits`,
              description: `Add ${(creditsCents / 100).toFixed(2)} credits to your wallet (includes ${CREDIT_FEE_PERCENT}% processing fee)`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=credits&credits=${creditsCents}`,
      cancel_url: `${cancelBaseUrl}/payment-canceled`,
      metadata: {
        type: "credit_purchase",
        user_id: user.id,
        amount_cents: amount_cents.toString(),
        fee_cents: feeCents.toString(),
        credits_cents: creditsCents.toString(),
      },
      payment_intent_data: {
        metadata: {
          type: "credit_purchase",
          user_id: user.id,
          credits_cents: creditsCents.toString(),
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        credits_preview: creditsCents,
        fee_cents: feeCents,
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
