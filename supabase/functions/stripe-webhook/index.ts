import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
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
    apiVersion: "2025-11-17.clover",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Read raw body bytes for accurate signature verification
    const rawBody = await req.arrayBuffer();
    const bodyText = new TextDecoder().decode(rawBody);
    
    // Trim whitespace from secret and signature header
    const webhookSecret = (Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "").trim();
    const signature = (req.headers.get("stripe-signature") ?? "").trim();
    
    // Diagnostic logging (no secrets leaked)
    const secretPresent = webhookSecret.length > 0;
    const signaturePresent = signature.length > 0;
    const signaturePrefix = signature.slice(0, 20);
    const bodyLength = rawBody.byteLength;
    
    logStep("Request received", { 
      secretPresent, 
      signaturePresent, 
      signaturePrefix,
      bodyLength 
    });
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        // Deno requires async signature verification (SubtleCrypto)
        event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : undefined;
        logStep("Webhook signature verification failed", { 
          error: errorMessage,
          stack: errorStack,
          secretPresent,
          signaturePresent,
          signaturePrefix,
          bodyLength
        });
        return new Response(JSON.stringify({ 
          error: "Webhook signature verification failed",
          details: errorMessage 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse without verification (for testing only - not recommended for production)
      logStep("WARNING: Parsing event without signature verification");
      event = JSON.parse(bodyText);
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
              .select("id, role")
              .eq("user_id", userId)
              .single();
            
            const previousRole = existingRole?.role || "fan";
            logStep("Current user role", { userId, previousRole, newTier: tier });

            // Fetch the Stripe subscription to get accurate period dates
            let stripeSubscription: Stripe.Subscription | null = null;
            if (session.subscription) {
              try {
                stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
                logStep("Retrieved Stripe subscription", { 
                  subscriptionId: stripeSubscription.id, 
                  status: stripeSubscription.status,
                  trialEnd: stripeSubscription.trial_end
                });
              } catch (e) {
                logStep("Error fetching Stripe subscription", { error: e });
              }
            }

            // Calculate trial_ends_at - use Stripe value or default to 90 days
            const trialEndsAt = stripeSubscription?.trial_end 
              ? new Date(stripeSubscription.trial_end * 1000).toISOString()
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

            // Calculate subscription status
            const subStatus = stripeSubscription?.status === "trialing" ? "trialing" : "active";

            // Update subscriptions table - MUST include trial_ends_at (NOT NULL constraint)
            const { error: subError } = await supabaseClient
              .from("subscriptions")
              .upsert({
                user_id: userId,
                tier: tier,
                status: subStatus,
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string,
                trial_ends_at: trialEndsAt,
                current_period_start: stripeSubscription 
                  ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
                  : new Date().toISOString(),
                current_period_end: stripeSubscription 
                  ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" });

            if (subError) {
              logStep("Error updating subscription", { error: subError });
            } else {
              logStep("Subscription updated successfully", { tier, status: subStatus, trialEndsAt });
            }

            // Sync user_roles table with new tier using UPDATE/INSERT strategy
            // (user_roles has unique constraint on user_id+role, not just user_id)
            if (existingRole) {
              // Update existing role
              const { error: roleError } = await supabaseClient
                .from("user_roles")
                .update({ role: tier })
                .eq("user_id", userId);

              if (roleError) {
                logStep("Error updating user role", { error: roleError });
              } else {
                logStep("User role updated", { from: previousRole, to: tier });
              }
            } else {
              // Insert new role
              const { error: roleError } = await supabaseClient
                .from("user_roles")
                .insert({ user_id: userId, role: tier });

              if (roleError) {
                logStep("Error inserting user role", { error: roleError });
              } else {
                logStep("User role inserted", { role: tier });
              }
            }

            // Handle role change side effects
            if (previousRole !== tier) {
              // Handle Artist → Label upgrade: migrate tracks
              if (previousRole === "artist" && tier === "label") {
                const { data: migratedTracks, error: trackMigrationError } = await supabaseClient
                  .from("tracks")
                  .update({ label_id: userId })
                  .eq("artist_id", userId)
                  .is("label_id", null)
                  .select("id");
                
                if (trackMigrationError) {
                  logStep("Error migrating tracks to label", { error: trackMigrationError });
                } else {
                  logStep("Tracks migrated to label ownership", { count: migratedTracks?.length || 0 });
                }
              }

              // Handle Label → Artist downgrade: release roster and revert tracks
              if (previousRole === "label" && tier === "artist") {
                // Release roster
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

                // Revert tracks: remove label_id for user's own tracks
                const { data: revertedTracks, error: trackRevertError } = await supabaseClient
                  .from("tracks")
                  .update({ label_id: null })
                  .eq("label_id", userId)
                  .eq("artist_id", userId)
                  .select("id");
                
                if (trackRevertError) {
                  logStep("Error reverting tracks from label", { error: trackRevertError });
                } else {
                  logStep("Tracks reverted to artist ownership", { count: revertedTracks?.length || 0 });
                }
              }

              // Create notification for role change
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: userId,
                  type: "role_change",
                  title: "Plan Changed",
                  message: `Your plan has been changed from ${previousRole.charAt(0).toUpperCase() + previousRole.slice(1)} to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
                  metadata: {
                    previous_role: previousRole,
                    new_role: tier,
                    change_type: ["fan", "artist", "label"].indexOf(tier) > ["fan", "artist", "label"].indexOf(previousRole) ? "upgrade" : "downgrade",
                  },
                });
              logStep("Role change notification created");
            } else {
              // Create activation notification
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: userId,
                  type: "role_change",
                  title: "Subscription Activated",
                  message: `Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription is now active!`,
                  metadata: {
                    new_role: tier,
                    change_type: "activation",
                  },
                });
              logStep("Subscription activation notification created");
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

                  // Create notification for credit purchase
                  await supabaseClient
                    .from("notifications")
                    .insert({
                      user_id: userId,
                      type: "credit_purchase",
                      title: "Credits Added!",
                      message: `$${(creditsCents / 100).toFixed(2)} credits have been added to your wallet.`,
                      metadata: {
                        amount_cents: creditsCents,
                        fee_cents: feeCents,
                        new_balance: newBalance,
                      },
                    });
                  logStep("Credit purchase notification created");
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

          // If tier changed, sync user_roles using UPDATE (not upsert with wrong constraint)
          if (newTier && newTier !== currentTier) {
            // First check if user has a role entry
            const { data: existingUserRole } = await supabaseClient
              .from("user_roles")
              .select("id")
              .eq("user_id", userId)
              .single();

            let roleError = null;
            if (existingUserRole) {
              const { error } = await supabaseClient
                .from("user_roles")
                .update({ role: newTier })
                .eq("user_id", userId);
              roleError = error;
            } else {
              const { error } = await supabaseClient
                .from("user_roles")
                .insert({ user_id: userId, role: newTier });
              roleError = error;
            }

            if (roleError) {
              logStep("Error syncing user role on subscription update", { error: roleError });
            } else {
              logStep("User role synced on subscription update", { from: currentTier, to: newTier });
              
              // Handle Artist → Label upgrade: migrate tracks
              if (currentTier === "artist" && newTier === "label") {
                const { data: migratedTracks, error: trackMigrationError } = await supabaseClient
                  .from("tracks")
                  .update({ label_id: userId })
                  .eq("artist_id", userId)
                  .is("label_id", null)
                  .select("id");
                
                if (trackMigrationError) {
                  logStep("Error migrating tracks to label on update", { error: trackMigrationError });
                } else {
                  logStep("Tracks migrated to label ownership on update", { count: migratedTracks?.length || 0 });
                }
              }

              // Handle Label → Artist downgrade: release roster and revert tracks
              if (currentTier === "label" && newTier === "artist") {
                // Release roster
                await supabaseClient
                  .from("label_roster")
                  .update({ status: "released" })
                  .eq("label_id", userId)
                  .eq("status", "active");
                logStep("Roster released due to plan change");

                // Revert tracks: remove label_id for user's own tracks
                const { data: revertedTracks, error: trackRevertError } = await supabaseClient
                  .from("tracks")
                  .update({ label_id: null })
                  .eq("label_id", userId)
                  .eq("artist_id", userId)
                  .select("id");
                
                if (trackRevertError) {
                  logStep("Error reverting tracks from label on update", { error: trackRevertError });
                } else {
                  logStep("Tracks reverted to artist ownership on update", { count: revertedTracks?.length || 0 });
                }
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

      // Stripe Connect Events for Artist Payouts
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        logStep("Connect account updated", { accountId: account.id });

        // Find user by stripe_account_id
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("stripe_account_id", account.id)
          .single();

        if (profile) {
          // Update profile with latest account status
          const newStatus = account.details_submitted 
            ? (account.payouts_enabled ? "active" : "restricted")
            : "pending";

          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              stripe_account_status: newStatus,
              stripe_payouts_enabled: account.payouts_enabled || false,
            })
            .eq("id", profile.id);

          if (updateError) {
            logStep("Error updating profile from webhook", { error: updateError });
          } else {
            logStep("Profile updated from webhook", { 
              userId: profile.id, 
              status: newStatus,
              payouts_enabled: account.payouts_enabled
            });
          }

          // Create notification if onboarding completed and payouts enabled
          if (account.details_submitted && account.payouts_enabled) {
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: profile.id,
                type: "payout_enabled",
                title: "Payouts Enabled!",
                message: "Your Stripe account is set up. You can now receive payouts from track sales.",
              });
            logStep("Payout enabled notification created", { userId: profile.id });
          }
        } else {
          logStep("No profile found for Connect account", { accountId: account.id });
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout paid", { payoutId: payout.id, amount: payout.amount });

        // Get the Connect account ID from the event
        const accountId = (event.account as string) || null;
        
        if (accountId) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("stripe_account_id", accountId)
            .single();

          if (profile) {
            // Update pending earnings to paid status
            const { error: earningsError } = await supabaseClient
              .from("artist_earnings")
              .update({ 
                status: "paid",
                paid_at: new Date().toISOString()
              })
              .eq("artist_id", profile.id)
              .eq("status", "pending");

            if (earningsError) {
              logStep("Error updating earnings to paid", { error: earningsError });
            } else {
              logStep("Earnings marked as paid", { userId: profile.id });
            }

            // Create notification
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: profile.id,
                type: "payout_received",
                title: "Payout Received!",
                message: `$${(payout.amount / 100).toFixed(2)} has been sent to your bank account.`,
                metadata: {
                  payout_id: payout.id,
                  amount_cents: payout.amount,
                },
              });
            logStep("Payout received notification created", { userId: profile.id });

            // Send payout email notification (non-blocking)
            try {
              const emailResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-payout-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    artistId: profile.id,
                    payoutAmountCents: payout.amount,
                    status: "paid",
                  }),
                }
              );
              logStep("Payout email sent", { status: emailResponse.status });
            } catch (emailError) {
              logStep("Payout email error (non-blocking)", { 
                error: emailError instanceof Error ? emailError.message : "Unknown" 
              });
            }
          }
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Payout failed", { payoutId: payout.id, failureMessage: payout.failure_message });

        const accountId = (event.account as string) || null;
        
        if (accountId) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("stripe_account_id", accountId)
            .single();

          if (profile) {
            // Update earnings to failed status
            const { error: earningsError } = await supabaseClient
              .from("artist_earnings")
              .update({ status: "failed" })
              .eq("artist_id", profile.id)
              .eq("status", "pending");

            if (earningsError) {
              logStep("Error updating earnings to failed", { error: earningsError });
            }

            // Create notification about failed payout
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: profile.id,
                type: "payout_failed",
                title: "Payout Failed",
                message: `Your payout could not be processed. Reason: ${payout.failure_message || "Unknown"}. Please check your bank details.`,
                metadata: {
                  payout_id: payout.id,
                  failure_message: payout.failure_message,
                },
              });
            logStep("Payout failure notification created", { userId: profile.id });

            // Send payout failed email notification (non-blocking)
            try {
              const emailResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-payout-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    artistId: profile.id,
                    payoutAmountCents: payout.amount,
                    status: "failed",
                    failureReason: payout.failure_message,
                  }),
                }
              );
              logStep("Payout failed email sent", { status: emailResponse.status });
            } catch (emailError) {
              logStep("Payout failed email error (non-blocking)", { 
                error: emailError instanceof Error ? emailError.message : "Unknown" 
              });
            }
          }
        }
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        logStep("Transfer created", { 
          transferId: transfer.id, 
          amount: transfer.amount,
          destination: transfer.destination 
        });
        // Transfer events are primarily for logging/auditing
        // The actual payout tracking happens via payout.paid events
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
