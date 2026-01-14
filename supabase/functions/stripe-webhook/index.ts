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

// Map Stripe price IDs to tiers (reverse of SUBSCRIPTION_PRICES)
const PRICE_TO_TIER: Record<string, "fan" | "artist" | "label"> = {
  "price_1SpXymEKeZaBsSwjs3UezAPu": "fan",
  "price_1SpXyyEKeZaBsSwj0fe2MazX": "artist",
  "price_1SpXz9EKeZaBsSwjgEhsxsHg": "label",
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
            // Get current role before update
            const { data: existingRole } = await supabaseClient
              .from("user_roles")
              .select("role")
              .eq("user_id", userId)
              .single();
            
            const previousRole = existingRole?.role || "fan";
            logStep("Current user role", { userId, previousRole, newTier: tier });

            // Update subscriptions table
            const { error: subError } = await supabaseClient
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

            if (subError) {
              logStep("Error updating subscription", { error: subError });
            } else {
              logStep("Subscription updated successfully");
            }

            // Sync user_roles table with new tier
            if (previousRole !== tier) {
              const { error: roleError } = await supabaseClient
                .from("user_roles")
                .upsert({
                  user_id: userId,
                  role: tier,
                }, { onConflict: "user_id" });

              if (roleError) {
                logStep("Error updating user role", { error: roleError });
              } else {
                logStep("User role synced", { from: previousRole, to: tier });
                
                // Handle Label → Artist downgrade: release roster
                if (previousRole === "label" && tier === "artist") {
                  const { error: rosterError } = await supabaseClient
                    .from("label_roster")
                    .update({ status: "released" })
                    .eq("label_id", userId)
                    .eq("status", "active");
                  
                  if (rosterError) {
                    logStep("Error releasing roster", { error: rosterError });
                  } else {
                    logStep("Roster released due to downgrade");
                  }
                }

                // Create notification for role change
                await supabaseClient
                  .from("notifications")
                  .insert({
                    user_id: userId,
                    type: "role_change",
                    title: previousRole === tier ? "Subscription Activated" : "Plan Changed",
                    message: previousRole === tier 
                      ? `Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription is now active!`
                      : `Your plan has been changed from ${previousRole.charAt(0).toUpperCase() + previousRole.slice(1)} to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
                    metadata: {
                      previous_role: previousRole,
                      new_role: tier,
                      change_type: tier === previousRole ? "activation" : 
                        (["fan", "artist", "label"].indexOf(tier) > ["fan", "artist", "label"].indexOf(previousRole) ? "upgrade" : "downgrade"),
                    },
                  });
                logStep("Role change notification created");
              }
            }
          }
        } else if (session.mode === "payment") {
          // Check if this is a credit purchase
          if (metadata.type === "credit_purchase") {
            const userId = metadata.user_id;
            const creditsCents = parseInt(metadata.credits_cents || "0", 10);
            const feeCents = parseInt(metadata.fee_cents || "0", 10);
            const amountCents = parseInt(metadata.amount_cents || "0", 10);

            if (userId && creditsCents > 0) {
              logStep("Processing credit purchase", { userId, creditsCents, feeCents });

              // Get or create wallet
              let { data: wallet } = await supabaseClient
                .from("credit_wallets")
                .select("*")
                .eq("user_id", userId)
                .single();

              if (!wallet) {
                const { data: newWallet, error: createError } = await supabaseClient
                  .from("credit_wallets")
                  .insert({ user_id: userId, balance_cents: 0 })
                  .select()
                  .single();
                
                if (createError) {
                  logStep("Error creating wallet", { error: createError });
                } else {
                  wallet = newWallet;
                }
              }

              if (wallet) {
                // Add credits to wallet
                const newBalance = wallet.balance_cents + creditsCents;
                const { error: updateError } = await supabaseClient
                  .from("credit_wallets")
                  .update({ balance_cents: newBalance })
                  .eq("user_id", userId);

                if (updateError) {
                  logStep("Error updating wallet balance", { error: updateError });
                } else {
                  logStep("Credits added to wallet", { 
                    previousBalance: wallet.balance_cents, 
                    added: creditsCents, 
                    newBalance 
                  });

                  // Record transaction
                  await supabaseClient
                    .from("credit_transactions")
                    .insert({
                      user_id: userId,
                      type: "purchase",
                      amount_cents: creditsCents,
                      fee_cents: feeCents,
                      stripe_payment_intent_id: session.payment_intent as string,
                      description: `Added $${(creditsCents / 100).toFixed(2)} credits`,
                    });
                  
                  logStep("Credit transaction recorded");
                }
              }
            }
          } else {
            // Handle track purchase (legacy Stripe direct purchase)
            const userId = metadata.user_id;
            const trackId = metadata.track_id;
            const trackPrice = parseFloat(metadata.track_price || "0");
            const tipAmount = parseFloat(metadata.tip_amount || "0");

            if (userId && trackId) {
              // Get current editions sold
              const { data: track } = await supabaseClient
                .from("tracks")
                .select("editions_sold, total_editions, artist_id, title")
                .eq("id", trackId)
                .single();

              if (track && track.editions_sold < track.total_editions) {
                const editionNumber = track.editions_sold + 1;
                const totalPaid = trackPrice + tipAmount;
                const priceCents = Math.round(totalPaid * 100);
                const platformFeeCents = Math.ceil(priceCents * 0.15);
                const artistPayoutCents = priceCents - platformFeeCents;

                // Create purchase record
                const { data: purchase, error: purchaseError } = await supabaseClient
                  .from("purchases")
                  .insert({
                    user_id: userId,
                    track_id: trackId,
                    edition_number: editionNumber,
                    price_paid: totalPaid,
                    tip_amount: tipAmount,
                  })
                  .select()
                  .single();

                if (purchaseError) {
                  logStep("Error creating purchase", { error: purchaseError });
                } else {
                  // Update editions sold
                  await supabaseClient
                    .from("tracks")
                    .update({ editions_sold: editionNumber })
                    .eq("id", trackId);

                  // Record artist earnings
                  await supabaseClient
                    .from("artist_earnings")
                    .insert({
                      artist_id: track.artist_id,
                      purchase_id: purchase.id,
                      gross_amount_cents: priceCents,
                      platform_fee_cents: platformFeeCents,
                      artist_payout_cents: artistPayoutCents,
                      status: "pending",
                    });

                  logStep("Purchase created successfully", { 
                    editionNumber, 
                    artistEarnings: artistPayoutCents / 100 
                  });
                }
              } else {
                logStep("Track sold out or not found");
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Get tier from subscription price
        const priceId = subscription.items.data[0]?.price?.id;
        const tierFromPrice = priceId ? PRICE_TO_TIER[priceId] : null;
        
        // Get metadata tier as fallback
        const subscriptionMeta = subscription.metadata || {};
        const tierFromMeta = subscriptionMeta.tier as "fan" | "artist" | "label" | undefined;
        
        const newTier = tierFromPrice || tierFromMeta;

        // Find user by stripe_subscription_id
        const { data: subRecord } = await supabaseClient
          .from("subscriptions")
          .select("user_id, tier")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (subRecord) {
          const userId = subRecord.user_id;
          const currentTier = subRecord.tier;

          // Update subscription status
          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
              status: subscription.status === "active" ? "active" : 
                     subscription.status === "past_due" ? "past_due" :
                     subscription.status === "canceled" ? "canceled" : "trialing",
              tier: newTier || currentTier, // Update tier if changed
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (updateError) {
            logStep("Error updating subscription status", { error: updateError });
          }

          // If tier changed, sync user_roles
          if (newTier && newTier !== currentTier) {
            const { error: roleError } = await supabaseClient
              .from("user_roles")
              .update({ role: newTier })
              .eq("user_id", userId);

            if (roleError) {
              logStep("Error syncing user role on subscription update", { error: roleError });
            } else {
              logStep("User role synced on subscription update", { from: currentTier, to: newTier });
              
              // Handle Label → Artist downgrade: release roster
              if (currentTier === "label" && newTier === "artist") {
                await supabaseClient
                  .from("label_roster")
                  .update({ status: "released" })
                  .eq("label_id", userId)
                  .eq("status", "active");
                logStep("Roster released due to plan change");
              }

              // Create notification for plan change
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: userId,
                  type: "role_change",
                  title: "Plan Changed",
                  message: `Your subscription has been changed from ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}.`,
                  metadata: {
                    previous_role: currentTier,
                    new_role: newTier,
                    change_type: ["fan", "artist", "label"].indexOf(newTier) > ["fan", "artist", "label"].indexOf(currentTier) ? "upgrade" : "downgrade",
                  },
                });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { data: subRecord } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

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

        // Create notification for subscription cancellation
        if (subRecord) {
          await supabaseClient
            .from("notifications")
            .insert({
              user_id: subRecord.user_id,
              type: "subscription_canceled",
              title: "Subscription Canceled",
              message: "Your subscription has been canceled. Some features may become restricted.",
              metadata: {
                canceled_at: new Date().toISOString(),
              },
            });
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
