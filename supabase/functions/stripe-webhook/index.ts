import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map Stripe price IDs to tiers (reverse of SUBSCRIPTION_PRICES)
const PRICE_TO_TIER: Record<string, "fan" | "artist" | "label"> = {
  "price_1T7sAyEKeZaBsSwj3L6Izcpg": "fan",    // Creator $10/mo
  "price_1T7smDEKeZaBsSwjVd5hBpyq": "artist",  // Creator Pro $25/mo
  "price_1T7sFHEKeZaBsSwjLEDZiC7L": "label",   // Label/Studio $79/mo
  // Legacy price IDs (keep for existing subscribers)
  "price_1SpXymEKeZaBsSwjs3UezAPu": "fan",
  "price_1SpXyyEKeZaBsSwj0fe2MazX": "artist",
  "price_1SpXz9EKeZaBsSwjgEhsxsHg": "label",
  "price_1T7sDgEKeZaBsSwjoHlPVKQL": "artist",  // old artist price
};

// AI credits per tier for monthly refresh
const TIER_CREDITS: Record<string, number> = {
  fan: 300,
  artist: 800,
  label: 2000,
};

// Product ID → AI credits mapping for credit packs & starter pack
const PRODUCT_AI_CREDITS: Record<string, number> = {
  "prod_U64QH9DtMPUYNi": 100,   // 100 AI Credits pack
  "prod_U64Scf2yEj3f3R": 500,   // 500 AI Credits pack
  "prod_U64VwSdypd7g5x": 2000,  // 2000 AI Credits pack
  "prod_U64XcXRpHSD7Qz": 500,   // AI Artist Starter Pack (500 credits)
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
      logStep("WARNING: Parsing event without signature verification");
      event = JSON.parse(bodyText);
    }

    logStep("Event received", { type: event.type, id: event.id });

    // ── IDEMPOTENCY CHECK ──────────────────────────────────────────────
    // Prevent duplicate processing if Stripe retries the webhook
    const { data: existingEvent } = await supabaseClient
      .from("webhook_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();

    if (existingEvent) {
      logStep("Event already processed, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record event as being processed
    await supabaseClient.from("webhook_events").insert({
      id: event.id,
      type: event.type,
    });
    logStep("Event recorded for idempotency", { eventId: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        logStep("Checkout session completed", { sessionId: session.id, metadata });

        // Handle Superfan subscription checkout
        if (metadata.type === "superfan" && session.mode === "subscription") {
          const fanId = metadata.fan_id;
          const artistId = metadata.artist_id;
          const membershipId = metadata.membership_id;

          if (fanId && artistId && membershipId) {
            logStep("Processing superfan subscription", { fanId, artistId, membershipId });

            const { error: subError } = await supabaseClient
              .from("superfan_subscribers")
              .upsert({
                membership_id: membershipId,
                artist_id: artistId,
                fan_id: fanId,
                status: "active",
                tier_level: "bronze",
                stripe_subscription_id: session.subscription as string,
                subscribed_at: new Date().toISOString(),
              }, { onConflict: "artist_id,fan_id" });

            if (subError) {
              logStep("Error creating superfan subscriber", { error: subError });
            } else {
              logStep("Superfan subscriber created/updated");
            }

            await supabaseClient.from("notifications").insert({
              user_id: artistId,
              type: "new_superfan",
              title: "New Superfan!",
              message: "Someone just subscribed to your Superfan Room!",
              metadata: { fan_id: fanId },
            });
          }
          break;
        }

        // ── MESSAGE CREDITS HANDLER ──────────────────────────────────────
        if (metadata.type === "message_credits" && session.mode === "payment") {
          const fanId = metadata.fan_id;
          const credits = parseInt(metadata.credits || "5", 10);

          if (fanId && credits > 0) {
            logStep("Processing message credits purchase", { fanId, credits });

            // Upsert message_credits balance
            const { data: existing } = await supabaseClient
              .from("message_credits")
              .select("id, balance")
              .eq("fan_id", fanId)
              .maybeSingle();

            if (existing) {
              await supabaseClient
                .from("message_credits")
                .update({ balance: existing.balance + credits, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
            } else {
              await supabaseClient
                .from("message_credits")
                .insert({ fan_id: fanId, balance: credits });
            }

            logStep("Message credits added", { fanId, credits, newBalance: (existing?.balance || 0) + credits });

            // Notify fan
            await supabaseClient.from("notifications").insert({
              user_id: fanId,
              type: "credits_purchased",
              title: "Message Credits Added!",
              message: `${credits} message credits have been added to your account.`,
              metadata: { credits },
            });
          }
          break;
        }

        // Handle Store product checkout
        if (metadata.type === "store" && session.mode === "payment") {
          const productId = metadata.product_id;
          const artistId = metadata.artist_id;
          const buyerId = metadata.buyer_id || null; // null for guest purchases
          const productType = metadata.product_type;
          const isGuest = metadata.is_guest === "true";
          const buyerEmail = metadata.buyer_email || session.customer_details?.email || null;
          const buyerName = metadata.buyer_name || session.customer_details?.name || null;

          if (productId && artistId) {
            logStep("Processing store purchase", { productId, artistId, buyerId, productType, isGuest });

            // ── ATOMIC INVENTORY DECREMENT ────────────────────────────────
            const { data: inventoryResult, error: inventoryError } = await supabaseClient.rpc(
              "decrement_inventory_atomic",
              { p_product_id: productId, p_quantity: 1 }
            );

            if (inventoryError || !inventoryResult?.success) {
              logStep("Inventory decrement failed", {
                error: inventoryError?.message,
                reason: inventoryResult?.reason,
              });
              // Inventory insufficient — issue refund
              try {
                if (session.payment_intent) {
                  await stripe.refunds.create({ payment_intent: session.payment_intent as string });
                  logStep("Auto-refund issued for oversold product", { productId });
                }
              } catch (refundErr) {
                logStep("Auto-refund failed", { error: refundErr instanceof Error ? refundErr.message : String(refundErr) });
              }
              break;
            }

            const editionNumber = inventoryResult.edition_number || null;
            const isSoldOut = inventoryResult.is_sold_out || false;

            // Get product details for earnings calculation and download URL
            const { data: product } = await supabaseClient
              .from("store_products")
              .select("price_cents, title, digital_file_url, license_pdf_url, type")
              .eq("id", productId)
              .single();

            const amountCents = product?.price_cents || 0;
            const platformFeeCents = Math.ceil(amountCents * 0.15);
            const artistPayoutCents = amountCents - platformFeeCents;

            // Determine order status based on product type
            const isMerchType = productType === "merch" || productType === "physical_merch";
            const orderStatus = isMerchType ? "pending" : "completed";
            const fulfillmentStatus = isMerchType ? "none" : (product?.digital_file_url ? "delivered" : "none");

            // Get shipping address from Stripe session
            let shippingAddress = null;
            if (session.shipping_details?.address) {
              shippingAddress = session.shipping_details.address;
            }

            // Create order (buyer_id can be null for guests)
            const { data: order, error: orderError } = await supabaseClient
              .from("store_orders")
              .insert({
                product_id: productId,
                buyer_id: buyerId || null,
                artist_id: artistId,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_cents: amountCents,
                platform_fee_cents: platformFeeCents,
                artist_payout_cents: artistPayoutCents,
                status: orderStatus,
                fulfillment_status: fulfillmentStatus,
                shipping_address: shippingAddress,
                buyer_name: buyerName,
                buyer_email: buyerEmail,
                edition_number: editionNumber,
              })
              .select()
              .single();

            if (orderError) {
              logStep("Error creating store order", { error: orderError });
            } else {
              logStep("Store order created", { orderId: order.id, status: orderStatus, editionNumber, isSoldOut });

              // Create store_downloads record for digital products
              if (product?.digital_file_url) {
                const downloadToken = crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

                const { error: dlError } = await supabaseClient
                  .from("store_downloads")
                  .insert({
                    order_id: order.id,
                    product_id: productId,
                    artist_id: artistId,
                    user_id: buyerId || null,
                    buyer_email: buyerEmail || "",
                    download_token: downloadToken,
                    download_url: product.digital_file_url,
                    license_url: product.license_pdf_url || null,
                    expires_at: expiresAt,
                    max_downloads: 10,
                  });

                if (dlError) {
                  logStep("Error creating download record", { error: dlError });
                } else {
                  logStep("Download record created", { token: downloadToken.slice(0, 8) + "..." });
                }
              }

              // Create earnings record
              await supabaseClient.from("artist_earnings").insert({
                artist_id: artistId,
                purchase_id: order.id,
                gross_amount_cents: amountCents,
                platform_fee_cents: platformFeeCents,
                artist_payout_cents: artistPayoutCents,
                status: "pending",
              });

              // Notify artist
              await supabaseClient.from("notifications").insert({
                user_id: artistId,
                type: "store_sale",
                title: "New Store Sale!",
                message: `Someone purchased "${product?.title || "a product"}" from your store.`,
                metadata: { product_id: productId, order_id: order.id },
              });

              // ── ENQUEUE ASYNC JOBS (non-blocking) ──────────────────────
              // Badge eval, analytics refresh, and trending refresh via job queue
              try {
                const jobInserts = [
                  { job_type: "evaluate_badges", payload: { user_id: buyerId } },
                  { job_type: "refresh_analytics", payload: { artist_id: artistId } },
                  { job_type: "refresh_trending", payload: {} },
                ];
                supabaseClient.from("job_queue").insert(jobInserts)
                  .then(({ error: jobErr }) => {
                    if (jobErr) logStep("Job queue insert failed", { error: jobErr.message });
                    else logStep("Background jobs enqueued (badges, analytics, trending)");
                  });

                // Also fire badge eval directly for immediate feedback
                fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-badges`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                    body: JSON.stringify({ user_id: buyerId }),
                  }
                ).catch(() => {});
              } catch (_) { /* non-blocking */ }

              // ── AWARD LOYALTY POINTS (non-blocking) ──────────────────────
              try {
                const loyaltyEventType = productType === "merch" ? "purchase_merch" :
                  metadata.is_limited === "true" ? "purchase_limited" :
                  metadata.is_early === "true" ? "purchase_early" :
                  "purchase_digital";

                fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/award-loyalty-points`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                    body: JSON.stringify({
                      fan_id: buyerId,
                      artist_id: artistId,
                      event_type: loyaltyEventType,
                    }),
                  }
                ).then(res => {
                  if (!res.ok) logStep("Loyalty points award failed", { status: res.status });
                  else logStep("Loyalty points awarded");
                }).catch(err => logStep("Loyalty points error", { error: err.message }));
              } catch (loyaltyErr) {
                logStep("Loyalty points error (non-blocking)", { error: loyaltyErr instanceof Error ? loyaltyErr.message : "Unknown" });
              }
            }
          }
          break;
        }

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
          // ── AI CREDIT PACK HANDLER ──────────────────────────────────────
          if (metadata.type === "ai_credit_pack") {
            const userId = metadata.user_id;
            const aiCredits = parseInt(metadata.ai_credits || "0", 10);
            const productId = metadata.product_id || "custom";

            if (userId && aiCredits > 0) {
              logStep("Processing AI credit pack purchase", { userId, aiCredits, productId });

              const { data: addResult, error: addError } = await supabaseClient.rpc(
                "add_ai_credits",
                { p_user_id: userId, p_credits: aiCredits }
              );

              if (addError) {
                logStep("Error adding AI credits", { error: addError.message });
              } else {
                logStep("AI credits added", { userId, credits: aiCredits, newBalance: addResult?.new_credits });

                // Record in ai_credit_usage
                await supabaseClient.from("ai_credit_usage").insert({
                  user_id: userId,
                  action: "credit_pack_purchase",
                  credits_used: -aiCredits, // negative = added
                  metadata: { product_id: productId, stripe_session_id: session.id },
                });

                // Notify user
                await supabaseClient.from("notifications").insert({
                  user_id: userId,
                  type: "credits_purchased",
                  title: "AI Credits Added! 🎉",
                  message: `${aiCredits} AI credits have been added to your wallet.`,
                  metadata: { credits: aiCredits, product_id: productId },
                });
              }
            }
            break;
          }

          // Check if this is a legacy credit purchase (USD wallet)
          if (metadata.type === "credit_purchase") {
            const userId = metadata.user_id;
            const creditsCents = parseInt(metadata.credits_cents || "0", 10);
            const feeCents = parseInt(metadata.fee_cents || "0", 10);

            if (userId && creditsCents > 0) {
              logStep("Processing legacy credit purchase", { userId, creditsCents, feeCents });

              const { data: addResult, error: addError } = await supabaseClient.rpc(
                'add_credits_atomic',
                { p_user_id: userId, p_amount_cents: creditsCents }
              );

              if (addError || !addResult?.success) {
                logStep("Error adding credits atomically", { error: addError?.message || "Unknown" });
              } else {
                logStep("Credits added atomically", { added: creditsCents, newBalance: addResult.new_balance });

                await supabaseClient.from("credit_transactions").insert({
                  user_id: userId,
                  type: "purchase",
                  amount_cents: creditsCents,
                  fee_cents: feeCents,
                  stripe_payment_intent_id: session.payment_intent as string,
                  description: `Added $${(creditsCents / 100).toFixed(2)} credits`,
                });
              }
            }
          } else {
            // Handle track purchase (legacy Stripe direct purchase)
            const userId = metadata.user_id;
            const trackId = metadata.track_id;
            const trackPrice = parseFloat(metadata.track_price || "0");
            const tipAmount = parseFloat(metadata.tip_amount || "0");

            if (userId && trackId) {
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
                  await supabaseClient
                    .from("tracks")
                    .update({ editions_sold: editionNumber })
                    .eq("id", trackId);

                  await supabaseClient.from("artist_earnings").insert({
                    artist_id: track.artist_id,
                    purchase_id: purchase.id,
                    gross_amount_cents: priceCents,
                    platform_fee_cents: platformFeeCents,
                    artist_payout_cents: artistPayoutCents,
                    status: "pending",
                  });

                  logStep("Purchase created successfully", { editionNumber, artistEarnings: artistPayoutCents / 100 });

                  // ── EVALUATE BADGES (non-blocking) ──────────────────
                  try {
                    fetch(
                      `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-badges`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                        },
                        body: JSON.stringify({ user_id: userId }),
                      }
                    ).then(res => {
                      if (!res.ok) logStep("Badge evaluation failed (track purchase)", { status: res.status });
                      else logStep("Badge evaluation triggered (track purchase)");
                    }).catch(err => logStep("Badge evaluation error", { error: err.message }));
                  } catch (_) { /* non-blocking */ }
                }
              } else {
                logStep("Track sold out or not found");
              }
            }
          }
        }
        break;
      }

      // ── CHARGE REFUNDED HANDLER ──────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        logStep("Charge refunded", { chargeId: charge.id, paymentIntentId });

        if (!paymentIntentId) {
          logStep("No payment_intent on refunded charge, skipping");
          break;
        }

        // Find the order by payment intent
        const { data: refundedOrder, error: orderLookupError } = await supabaseClient
          .from("store_orders")
          .select("id, product_id, buyer_id, artist_id, status")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (orderLookupError || !refundedOrder) {
          logStep("No store order found for refunded charge — checking for AI credit pack", { paymentIntentId });

          // ── AI CREDIT PACK REFUND CLAWBACK ──────────────────────────────
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const piMeta = paymentIntent.metadata || {};

            if (piMeta.type === "ai_credit_pack" && piMeta.user_id && piMeta.ai_credits) {
              const creditsToRemove = Number(piMeta.ai_credits);
              const targetUserId = piMeta.user_id;
              logStep("AI credit pack refund detected", { targetUserId, creditsToRemove });

              const { data: deductResult } = await supabaseClient.rpc("deduct_ai_credits", {
                p_user_id: targetUserId,
                p_credits: creditsToRemove,
              });

              if (deductResult?.success) {
                logStep("AI credits clawed back successfully", { deductResult });
              } else {
                logStep("Insufficient credits for full clawback — flagging account", { deductResult });
                await supabaseClient.from("notifications").insert({
                  user_id: targetUserId,
                  type: "account_flag",
                  title: "Credit Pack Refund",
                  message: `A refund of ${creditsToRemove} AI credits was issued but your balance was insufficient. Account flagged for admin review.`,
                  metadata: { payment_intent_id: paymentIntentId, credits_attempted: creditsToRemove },
                });
              }

              // Log the reversal transaction
              await supabaseClient.from("ai_credit_usage").insert({
                user_id: targetUserId,
                action: "credit_pack_refund_clawback",
                credits_used: creditsToRemove,
                metadata: { payment_intent_id: paymentIntentId, success: deductResult?.success ?? false },
              });
            } else {
              logStep("Refunded charge is not an AI credit pack, skipping");
            }
          } catch (piError) {
            logStep("Error retrieving payment intent for refund clawback", { error: String(piError) });
          }

          break;
        }

        if (refundedOrder.status === "refunded") {
          logStep("Order already refunded, skipping", { orderId: refundedOrder.id });
          break;
        }

        // Update order status to refunded
        await supabaseClient
          .from("store_orders")
          .update({ status: "refunded" })
          .eq("id", refundedOrder.id);
        logStep("Order marked as refunded", { orderId: refundedOrder.id });

        // Restore inventory atomically
        const { data: restoreResult } = await supabaseClient.rpc(
          "restore_inventory_atomic",
          { p_product_id: refundedOrder.product_id, p_quantity: 1 }
        );
        logStep("Inventory restored", { result: restoreResult });

        // Subtract loyalty points (direct DB update — defense-in-depth)
        const { data: loyaltyRow } = await supabaseClient
          .from("fan_loyalty")
          .select("id, points, level")
          .eq("fan_id", refundedOrder.buyer_id)
          .eq("artist_id", refundedOrder.artist_id)
          .maybeSingle();

        if (loyaltyRow) {
          const newPoints = Math.max(loyaltyRow.points - 10, 0);
          const LEVEL_THRESHOLDS = [
            { level: "founding_superfan", points: 1000 },
            { level: "elite", points: 500 },
            { level: "insider", points: 150 },
            { level: "supporter", points: 50 },
            { level: "listener", points: 0 },
          ];
          let newLevel = "listener";
          for (const t of LEVEL_THRESHOLDS) {
            if (newPoints >= t.points) { newLevel = t.level; break; }
          }
          await supabaseClient
            .from("fan_loyalty")
            .update({ points: newPoints, level: newLevel })
            .eq("id", loyaltyRow.id);
          logStep("Loyalty points subtracted on refund", { newPoints, newLevel });
        }

        // Notify artist about refund
        const { data: refundedProduct } = await supabaseClient
          .from("store_products")
          .select("title")
          .eq("id", refundedOrder.product_id)
          .single();

        await supabaseClient.from("notifications").insert({
          user_id: refundedOrder.artist_id,
          type: "store_refund",
          title: "Order Refunded",
          message: `An order for "${refundedProduct?.title || "a product"}" has been refunded.`,
          metadata: { order_id: refundedOrder.id, product_id: refundedOrder.product_id },
        });
        logStep("Refund notification sent to artist");

        // ── RE-EVALUATE BADGES after refund (non-blocking) ────────────
        try {
          fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-badges`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ user_id: refundedOrder.buyer_id }),
            }
          ).then(res => {
            if (!res.ok) logStep("Badge re-evaluation failed (refund)", { status: res.status });
            else logStep("Badge re-evaluation triggered (refund)");
          }).catch(err => logStep("Badge re-evaluation error", { error: err.message }));
        } catch (_) { /* non-blocking */ }

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

          // Check if subscription was just resumed from pause
          // pause_collection will be null when resumed
          const wasPreviouslyPaused = !subscription.pause_collection;
          
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

          // Check if this is an auto-resume from pause (pause_collection changed from set to null)
          // We detect this by checking if subscription is active and had a resumes_at that just passed
          if (subscription.status === "active" && !subscription.pause_collection) {
            // Check if there was a recent pause notification to determine if this was an auto-resume
            const { data: recentPauseNotification } = await supabaseClient
              .from("notifications")
              .select("metadata")
              .eq("user_id", userId)
              .eq("type", "subscription_paused")
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (recentPauseNotification?.metadata) {
              const pauseMetadata = recentPauseNotification.metadata as { resumes_at?: string };
              const resumesAt = pauseMetadata.resumes_at;
              
              // If there was a scheduled resume date that has passed, this is an auto-resume
              if (resumesAt) {
                const resumeDate = new Date(resumesAt);
                const now = new Date();
                // Allow 1 day buffer for timing differences
                if (resumeDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
                  logStep("Auto-resume detected from pause", { userId, resumesAt });
                  
                  // Create auto-resume notification
                  await supabaseClient
                    .from("notifications")
                    .insert({
                      user_id: userId,
                      type: "subscription_resumed",
                      title: "Subscription Automatically Resumed",
                      message: "Your pause period has ended. Your subscription is now active and billing has resumed.",
                      metadata: {
                        resumed_at: new Date().toISOString(),
                        was_automatic: true,
                      },
                    });

                  // Send auto-resume email (non-blocking)
                  try {
                    fetch(
                      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-resume-email`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                        },
                        body: JSON.stringify({
                          userId,
                          tier: newTier || currentTier,
                          resumedAt: new Date().toISOString(),
                          wasAutomatic: true,
                        }),
                      }
                    ).then(res => {
                      if (!res.ok) logStep("Auto-resume email failed", { status: res.status });
                      else logStep("Auto-resume email sent");
                    }).catch(err => logStep("Auto-resume email error", { error: err.message }));
                  } catch (emailError) {
                    logStep("Auto-resume email error (non-blocking)", { 
                      error: emailError instanceof Error ? emailError.message : "Unknown" 
                    });
                  }
                }
              }
            }
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

        // Check if this is a superfan subscription
        const subMeta = subscription.metadata || {};
        if (subMeta.type === "superfan") {
          logStep("Superfan subscription deleted", { artistId: subMeta.artist_id, fanId: subMeta.fan_id });
          await supabaseClient
            .from("superfan_subscribers")
            .update({ status: "expired" })
            .eq("stripe_subscription_id", subscription.id);
          break;
        }

        const { data: subRecord } = await supabaseClient
          .from("subscriptions")
          .select("user_id, tier")
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

          // Send cancellation email (non-blocking)
          try {
            const periodEnd = subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : undefined;

            fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-cancellation-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  userId: subRecord.user_id,
                  tier: subRecord.tier,
                  canceledAt: new Date().toISOString(),
                  periodEnd,
                }),
              }
            ).then(res => {
              if (!res.ok) logStep("Cancellation email failed", { status: res.status });
              else logStep("Cancellation email sent");
            }).catch(err => logStep("Cancellation email error", { error: err.message }));
          } catch (emailError) {
            logStep("Cancellation email error (non-blocking)", { 
              error: emailError instanceof Error ? emailError.message : "Unknown" 
            });
          }
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

      // ── INVOICE PAID → Monthly Credit Refresh ──────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        // Only process subscription invoices (not one-time payments)
        if (invoice.subscription && invoice.billing_reason !== "subscription_create") {
          const subscriptionId = invoice.subscription as string;

          // Find user and tier from our subscriptions table
          const { data: subRecord } = await supabaseClient
            .from("subscriptions")
            .select("user_id, tier")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (subRecord) {
            const creditsToAdd = TIER_CREDITS[subRecord.tier] || 0;

            if (creditsToAdd > 0) {
              const { data: addResult, error: addError } = await supabaseClient.rpc(
                "add_ai_credits",
                { p_user_id: subRecord.user_id, p_credits: creditsToAdd }
              );

              if (addError) {
                logStep("Error adding monthly AI credits", { error: addError.message });
              } else {
                logStep("Monthly AI credits added", {
                  userId: subRecord.user_id,
                  tier: subRecord.tier,
                  credits: creditsToAdd,
                  newBalance: addResult?.new_credits,
                });

                // Record usage
                await supabaseClient.from("ai_credit_usage").insert({
                  user_id: subRecord.user_id,
                  action: "monthly_refresh",
                  credits_used: -creditsToAdd, // negative = added
                  metadata: { tier: subRecord.tier, invoice_id: invoice.id },
                });

                // Notify user
                await supabaseClient.from("notifications").insert({
                  user_id: subRecord.user_id,
                  type: "credits_refreshed",
                  title: "Monthly Credits Refreshed!",
                  message: `${creditsToAdd} AI credits have been added to your wallet.`,
                  metadata: { credits: creditsToAdd, tier: subRecord.tier },
                });
              }
            }
          }
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
