import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // If webhook secret is configured, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
          status: 400,
        });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        logStep("Checkout session completed", { sessionId: session.id, metadata });

        if (session.mode === "subscription") {
          // Handle subscription creation
          const userId = metadata.user_id;
          const tier = metadata.tier as "fan" | "artist" | "label";
          
          if (userId && tier) {
            const { error } = await supabaseClient
              .from("subscriptions")
              .upsert({
                user_id: userId,
                tier: tier,
                status: "active",
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (error) {
              logStep("Error updating subscription", { error });
            } else {
              logStep("Subscription updated successfully");
            }
          }
        } else if (session.mode === "payment") {
          // Handle track purchase
          const userId = metadata.user_id;
          const trackId = metadata.track_id;
          const trackPrice = parseFloat(metadata.track_price || "0");
          const tipAmount = parseFloat(metadata.tip_amount || "0");

          if (userId && trackId) {
            // Get current editions sold
            const { data: track } = await supabaseClient
              .from("tracks")
              .select("editions_sold, total_editions")
              .eq("id", trackId)
              .single();

            if (track && track.editions_sold < track.total_editions) {
              const editionNumber = track.editions_sold + 1;

              // Create purchase record
              const { error: purchaseError } = await supabaseClient
                .from("purchases")
                .insert({
                  user_id: userId,
                  track_id: trackId,
                  edition_number: editionNumber,
                  price_paid: trackPrice + tipAmount,
                  tip_amount: tipAmount,
                });

              if (purchaseError) {
                logStep("Error creating purchase", { error: purchaseError });
              } else {
                // Update editions sold
                await supabaseClient
                  .from("tracks")
                  .update({ editions_sold: editionNumber })
                  .eq("id", trackId);

                logStep("Purchase created successfully", { editionNumber });
              }
            } else {
              logStep("Track sold out or not found");
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Find user by stripe_subscription_id and update status
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : 
                   subscription.status === "past_due" ? "past_due" :
                   subscription.status === "canceled" ? "canceled" : "trialing",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error updating subscription status", { error });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error marking subscription as canceled", { error });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
