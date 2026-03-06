import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Subscription price IDs by tier (Creator / Creator Pro / Label-Studio)
const SUBSCRIPTION_PRICES = {
  fan: "price_1T7sAyEKeZaBsSwj3L6Izcpg",       // Creator $10/mo
  artist: "price_1T7smDEKeZaBsSwjVd5hBpyq",     // Creator Pro $25/mo
  label: "price_1T7sFHEKeZaBsSwjLEDZiC7L",      // Label/Studio $79/mo
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { mode, tier, trackId, trackTitle, trackPrice, tipAmount } = await req.json();
    logStep("Request body parsed", { mode, tier, trackId, trackPrice, tipAmount });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-11-17.clover",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
    
    // Detect if request is from mobile app
    const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
    const successBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    const cancelBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    
    logStep("URL configuration", { origin, isMobileApp, successBaseUrl });
    
    let session;

    if (mode === "subscription") {
      // Create subscription checkout
      const priceId = SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES];
      if (!priceId) throw new Error(`Invalid tier: ${tier}`);

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 90, // 3 months free trial
          metadata: {
            user_id: user.id,
            tier: tier,
          },
        },
        success_url: `${successBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url: `${cancelBaseUrl}/`,
        metadata: {
          user_id: user.id,
          tier: tier,
        },
      });
      logStep("Subscription checkout session created", { sessionId: session.id });
    } else if (mode === "payment") {
      // Create one-time payment for track purchase with tip
      const totalAmount = Math.round((trackPrice + tipAmount) * 100); // Convert to cents
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: trackTitle || "Track Download",
                description: `Track purchase${tipAmount > 0 ? ` with $${tipAmount.toFixed(2)} tip` : ""}`,
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${successBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=purchase&track_id=${trackId}`,
        cancel_url: `${cancelBaseUrl}/`,
        metadata: {
          user_id: user.id,
          track_id: trackId,
          track_price: trackPrice.toString(),
          tip_amount: tipAmount.toString(),
        },
      });
      logStep("Payment checkout session created", { sessionId: session.id, totalAmount });
    } else {
      throw new Error(`Invalid mode: ${mode}`);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
