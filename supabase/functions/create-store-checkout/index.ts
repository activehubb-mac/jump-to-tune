import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-STORE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { productId, quantity = 1 } = await req.json();
    if (!productId) throw new Error("Missing productId");

    // Get product
    const { data: product, error: prodError } = await supabaseClient
      .from("store_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (prodError || !product) throw new Error("Product not found");
    if (!product.is_active) throw new Error("Product is not active");

    // Check scheduled release
    if (product.scheduled_release_at && new Date(product.scheduled_release_at) > new Date()) {
      throw new Error("This product has not been released yet");
    }

    // Check inventory
    if (product.inventory_limit !== null) {
      if (product.inventory_sold >= product.inventory_limit) {
        throw new Error("Product is sold out");
      }
    }

    // Check max per account
    if (product.max_per_account !== null) {
      const { count, error: countError } = await supabaseClient
        .from("store_orders")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("buyer_id", user.id)
        .in("status", ["completed", "pending"]);

      if (countError) throw new Error("Failed to check purchase limit");
      if ((count ?? 0) >= product.max_per_account) {
        throw new Error(`You can only purchase this product ${product.max_per_account} time(s)`);
      }
    }

    logStep("Product validated", { title: product.title, type: product.type });

    // Get artist's Stripe Connect account
    const { data: artistProfile } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled, display_name")
      .eq("id", product.artist_id)
      .single();

    if (!artistProfile?.stripe_account_id || !artistProfile.stripe_payouts_enabled) {
      throw new Error("Artist has not set up payouts");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-11-17.clover",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const applicationFeeAmount = Math.ceil(product.price_cents * quantity * 0.15);
    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
    const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
    const successBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    const cancelBaseUrl = isMobileApp ? "jumtunes:/" : origin;

    const isMerch = product.type === "merch";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
          },
          quantity,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: artistProfile.stripe_account_id,
        },
        metadata: {
          type: "store",
          product_id: productId,
          artist_id: product.artist_id,
          buyer_id: user.id,
          product_type: product.type,
        },
      },
      metadata: {
        type: "store",
        product_id: productId,
        artist_id: product.artist_id,
        buyer_id: user.id,
        product_type: product.type,
      },
      success_url: `${successBaseUrl}/artist/${product.artist_id}?store_success=true`,
      cancel_url: `${cancelBaseUrl}/artist/${product.artist_id}?store_canceled=true`,
    };

    // Collect shipping for merch
    if (isMerch) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "JP", "NZ"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

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
