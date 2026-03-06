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

// Product-based credit packs (Stripe price IDs)
const CREDIT_PACK_PRICES: Record<string, { priceId: string; credits: number; label: string }> = {
  "prod_U64QH9DtMPUYNi": { priceId: "price_1T7sHSEKeZaBsSwjc7RmfSqe", credits: 100, label: "100 AI Credits" },
  "prod_U64Scf2yEj3f3R": { priceId: "price_1T7sJdEKeZaBsSwjcJqdnD0V", credits: 500, label: "500 AI Credits" },
  "prod_U64VwSdypd7g5x": { priceId: "price_1T7sM6EKeZaBsSwjtCVk5uFi", credits: 2000, label: "2,000 AI Credits" },
  "prod_U64XcXRpHSD7Qz": { priceId: "price_1T7sOTEKeZaBsSwjGN5Uhkg6", credits: 500, label: "AI Artist Starter Pack" },
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
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    if (!user.email) {
      return new Response(
        JSON.stringify({ error: "No email associated with your account." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const body = await req.json();
    const { product_id, amount_cents } = body;

    // Determine which product to use
    let priceId: string;
    let credits: number;
    let packLabel: string;
    let totalCents: number;

    if (product_id && CREDIT_PACK_PRICES[product_id]) {
      // Use predefined Stripe product/price
      const pack = CREDIT_PACK_PRICES[product_id];
      priceId = pack.priceId;
      credits = pack.credits;
      packLabel = pack.label;
      totalCents = 0; // price is set in Stripe
      logStep("Using predefined pack", { product_id, credits, priceId });
    } else if (amount_cents && typeof amount_cents === "number" && amount_cents >= 500) {
      // Legacy: custom amount (fallback)
      const feeCents = Math.ceil(amount_cents * 0.01);
      credits = amount_cents - feeCents;
      packLabel = `${(credits / 100).toFixed(2)} Credits`;
      totalCents = amount_cents;
      logStep("Using custom amount (legacy)", { amount_cents, credits });
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid product or amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
    const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
    const successBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    const cancelBaseUrl = isMobileApp ? "jumtunes:/" : origin;

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: "usd",
            product_data: { name: packLabel },
            unit_amount: totalCents,
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: lineItems,
      mode: "payment",
      success_url: `${successBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=credits&credits=${credits}`,
      cancel_url: `${cancelBaseUrl}/payment-canceled`,
      metadata: {
        type: "ai_credit_pack",
        user_id: user.id,
        product_id: product_id || "custom",
        ai_credits: credits.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url, credits_preview: credits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
