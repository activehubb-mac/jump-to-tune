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
  console.log(`[CREATE-SUPERFAN-CHECKOUT] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { artistId, membershipId } = await req.json();
    if (!artistId || !membershipId) throw new Error("Missing artistId or membershipId");

    // Get membership details
    const { data: membership, error: memError } = await supabaseClient
      .from("superfan_memberships")
      .select("*")
      .eq("id", membershipId)
      .single();

    if (memError || !membership) throw new Error("Membership not found");
    if (!membership.is_active) throw new Error("Membership is not active");
    logStep("Membership found", { priceCents: membership.monthly_price_cents });

    // Get artist's Stripe Connect account
    const { data: artistProfile } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled, display_name")
      .eq("id", artistId)
      .single();

    if (!artistProfile?.stripe_account_id || !artistProfile.stripe_payouts_enabled) {
      throw new Error("Artist has not set up payouts");
    }
    logStep("Artist Stripe account found", { accountId: artistProfile.stripe_account_id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-11-17.clover",
    });

    // Check if fan already has a Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const platformFeeFraction = 0.15;
    const applicationFeeAmount = Math.ceil(membership.monthly_price_cents * platformFeeFraction);

    const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
    const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
    const successBaseUrl = isMobileApp ? "jumtunes:/" : origin;
    const cancelBaseUrl = isMobileApp ? "jumtunes:/" : origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: membership.monthly_price_cents,
            recurring: { interval: "month" },
            product_data: {
              name: `Superfan - ${artistProfile.display_name || "Artist"}`,
              description: membership.description || "Superfan membership with exclusive perks",
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: 15,
        transfer_data: {
          destination: artistProfile.stripe_account_id,
        },
        metadata: {
          type: "superfan",
          artist_id: artistId,
          membership_id: membershipId,
          fan_id: user.id,
        },
      },
      metadata: {
        type: "superfan",
        artist_id: artistId,
        membership_id: membershipId,
        fan_id: user.id,
      },
      success_url: `${successBaseUrl}/artist/${artistId}/superfan?success=true`,
      cancel_url: `${cancelBaseUrl}/artist/${artistId}/superfan?canceled=true`,
    });

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
