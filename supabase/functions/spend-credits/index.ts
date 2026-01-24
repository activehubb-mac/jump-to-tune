import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SPEND-CREDITS] ${step}${detailsStr}`);
};

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee on purchases
const ARTIST_SHARE_PERCENT = 85; // 85% to artist

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

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { track_id } = await req.json();
    
    if (!track_id) {
      throw new Error("Track ID is required");
    }

    logStep("Track ID received", { track_id });

    // Check if user already owns this track
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("track_id", track_id)
      .single();

    if (existingPurchase) {
      throw new Error("You already own this track");
    }

    // Get track details with artist and label info
    const { data: track, error: trackError } = await supabaseClient
      .from("tracks")
      .select(`
        *, 
        artist:profiles!tracks_artist_id_fkey(id, display_name, stripe_account_id, stripe_payouts_enabled),
        label:profiles!tracks_label_id_fkey(id, display_name, stripe_account_id, stripe_payouts_enabled)
      `)
      .eq("id", track_id)
      .single();

    if (trackError || !track) {
      throw new Error("Track not found");
    }

    const priceCents = Math.round(track.price * 100); // Convert dollars to cents
    logStep("Track found", { title: track.title, price_cents: priceCents });

    // ATOMIC: Deduct credits from wallet using atomic database function
    // This prevents race conditions where concurrent requests could double-spend
    const { data: deductResult, error: deductError } = await supabaseClient.rpc(
      'deduct_credits_atomic',
      { p_user_id: userId, p_amount_cents: priceCents }
    );

    if (deductError) {
      logStep("Atomic deduction error", { error: deductError.message });
      throw new Error("Failed to process payment");
    }

    if (!deductResult || deductResult.success === false) {
      // Insufficient balance - return the current balance
      const currentBalance = deductResult?.current_balance ?? 0;
      logStep("Insufficient credits", { balance: currentBalance, required: priceCents });
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          balance_cents: currentBalance,
          required_cents: priceCents,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const previousBalance = deductResult.previous_balance;
    const newBalance = deductResult.new_balance;
    logStep("Credits deducted atomically", { 
      previous: previousBalance, 
      deducted: priceCents, 
      new_balance: newBalance 
    });

    // Calculate revenue split
    const platformFeeCents = Math.ceil(priceCents * (PLATFORM_FEE_PERCENT / 100));
    const artistPayoutCents = priceCents - platformFeeCents;

    // Determine earnings recipient: label if present, otherwise artist
    const earningsRecipient = track.label_id ? track.label : track.artist;
    const earningsRecipientId = track.label_id || track.artist_id;
    const recipientType = track.label_id ? "label" : "artist";

    logStep("Revenue split calculated", { 
      gross: priceCents, 
      platform_fee: platformFeeCents, 
      artist_payout: artistPayoutCents,
      recipient_type: recipientType,
      recipient_id: earningsRecipientId,
    });

    // Get next edition number
    const { data: lastPurchase } = await supabaseClient
      .from("purchases")
      .select("edition_number")
      .eq("track_id", track_id)
      .order("edition_number", { ascending: false })
      .limit(1)
      .single();

    const editionNumber = (lastPurchase?.edition_number || 0) + 1;

    // Check if editions are still available
    if (editionNumber > track.total_editions) {
      // Refund credits since we already deducted them
      await supabaseClient.rpc('add_credits_atomic', { 
        p_user_id: userId, 
        p_amount_cents: priceCents 
      });
      throw new Error("All editions have been sold");
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("purchases")
      .insert({
        user_id: userId,
        track_id: track_id,
        price_paid: track.price,
        edition_number: editionNumber,
        tip_amount: 0,
      })
      .select()
      .single();

    if (purchaseError) {
      // Refund credits since purchase failed
      await supabaseClient.rpc('add_credits_atomic', { 
        p_user_id: userId, 
        p_amount_cents: priceCents 
      });
      logStep("Purchase failed, credits refunded", { error: purchaseError.message });
      throw new Error("Failed to create purchase record");
    }

    // Record credit transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        type: "spend",
        amount_cents: -priceCents,
        reference_id: purchase.id,
        description: `Purchased: ${track.title}`,
      });

    // Record earnings (to label if present, otherwise artist)
    const { data: earnings, error: earningsError } = await supabaseClient
      .from("artist_earnings")
      .insert({
        artist_id: earningsRecipientId, // Label or Artist receives earnings
        purchase_id: purchase.id,
        gross_amount_cents: priceCents,
        platform_fee_cents: platformFeeCents,
        artist_payout_cents: artistPayoutCents,
        status: "pending",
      })
      .select()
      .single();

    if (earningsError) {
      logStep("Warning: Failed to record earnings", { error: earningsError.message });
    }

    // Update track editions_sold count
    await supabaseClient
      .from("tracks")
      .update({ editions_sold: editionNumber })
      .eq("id", track_id);

    logStep("Purchase completed", { 
      purchase_id: purchase.id, 
      edition_number: editionNumber,
      earnings_id: earnings?.id,
    });

    // Create notifications for buyer and seller
    // Notification for buyer (in-app)
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: userId,
        type: "track_purchase",
        title: "Track Purchased!",
        message: `You now own edition #${editionNumber} of "${track.title}"`,
        metadata: {
          track_id: track_id,
          edition_number: editionNumber,
          price_cents: priceCents,
          artist_name: track.artist?.display_name,
        },
      });
    logStep("Buyer notification created");

    // Send push notification to buyer (non-blocking)
    try {
      fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title: "Track Purchased! 🎵",
            body: `You now own edition #${editionNumber} of "${track.title}"`,
            data: {
              type: "track_purchase",
              track_id: track_id,
            },
          }),
        }
      ).catch(err => logStep("Buyer push notification error", { error: err.message }));
    } catch (e) {
      logStep("Buyer push notification error (caught)", { error: e instanceof Error ? e.message : "Unknown" });
    }

    // Notification for artist/label about sale (in-app)
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: earningsRecipientId,
        type: "track_sale",
        title: "New Sale! 🎉",
        message: `"${track.title}" - Edition #${editionNumber} sold for $${(priceCents / 100).toFixed(2)}`,
        metadata: {
          track_id: track_id,
          edition_number: editionNumber,
          earnings_cents: artistPayoutCents,
          buyer_id: userId,
        },
      });
    logStep("Seller notification created");

    // Send push notification to seller (non-blocking)
    try {
      fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: earningsRecipientId,
            title: "New Sale! 🎉",
            body: `"${track.title}" sold for $${(priceCents / 100).toFixed(2)} - You earned $${(artistPayoutCents / 100).toFixed(2)}`,
            data: {
              type: "track_sale",
              track_id: track_id,
              earnings_cents: artistPayoutCents,
            },
          }),
        }
      ).catch(err => logStep("Seller push notification error", { error: err.message }));
    } catch (e) {
      logStep("Seller push notification error (caught)", { error: e instanceof Error ? e.message : "Unknown" });
    }

    // Send sale email to artist/label (non-blocking)
    try {
      const saleEmailPayload = {
        recipientId: earningsRecipientId,
        recipientType: recipientType,
        trackTitle: track.title,
        trackId: track_id,
        coverArtUrl: track.cover_art_url,
        editionNumber,
        totalEditions: track.total_editions,
        grossAmountCents: priceCents,
        earningsCents: artistPayoutCents,
      };

      fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sale-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(saleEmailPayload),
        }
      ).then(res => {
        if (!res.ok) logStep("Sale email failed", { status: res.status });
        else logStep("Sale email sent");
      }).catch(err => logStep("Sale email error", { error: err.message }));
    } catch (emailError) {
      logStep("Sale email error (non-blocking)", { 
        error: emailError instanceof Error ? emailError.message : "Unknown" 
      });
    }

    // Low balance warning notification
    const avgPurchaseCents = 200; // Default $2 threshold
    if (newBalance < avgPurchaseCents && newBalance > 0) {
      await supabaseClient
        .from("notifications")
        .insert({
          user_id: userId,
          type: "low_balance",
          title: "Low Credit Balance",
          message: `Your balance is $${(newBalance / 100).toFixed(2)}. Consider topping up!`,
          metadata: { balance_cents: newBalance },
        });
      logStep("Low balance notification created");

      // Send low balance email (non-blocking)
      try {
        fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-low-balance-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ userId, balanceCents: newBalance }),
          }
        ).then(res => {
          if (!res.ok) logStep("Low balance email failed", { status: res.status });
          else logStep("Low balance email sent");
        }).catch(err => logStep("Low balance email error", { error: err.message }));
      } catch (emailError) {
        logStep("Low balance email error (non-blocking)", { 
          error: emailError instanceof Error ? emailError.message : "Unknown" 
        });
      }
    }

    // If earnings recipient has Stripe Connect, log for payout
    if (earningsRecipient?.stripe_account_id && earningsRecipient?.stripe_payouts_enabled) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-11-17.clover",
        });

        // Note: This would require having funds in your Stripe account
        // For now, we just record the earnings for later payout
        logStep(`${recipientType} has Stripe Connect - earnings recorded for payout`, {
          stripe_account_id: earningsRecipient.stripe_account_id,
          payout_cents: artistPayoutCents,
          recipient_type: recipientType,
        });
      } catch (stripeError) {
        logStep("Stripe transfer skipped", { 
          error: stripeError instanceof Error ? stripeError.message : "Unknown" 
        });
      }
    }

    // Send purchase confirmation email (non-blocking)
    try {
      const emailPayload = {
        userId,
        trackTitle: track.title,
        artistName: track.artist?.display_name || "Unknown Artist",
        labelName: track.label?.display_name || null,
        coverArtUrl: track.cover_art_url,
        pricePaid: priceCents,
        tipAmount: 0,
        editionNumber,
        totalEditions: track.total_editions,
      };

      // Call the send-purchase-email function
      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-purchase-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!emailResponse.ok) {
        logStep("Purchase email failed", { status: emailResponse.status });
      } else {
        logStep("Purchase email sent");
      }
    } catch (emailError) {
      logStep("Purchase email error (non-blocking)", { 
        error: emailError instanceof Error ? emailError.message : "Unknown" 
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        purchase_id: purchase.id,
        edition_number: editionNumber,
        track: {
          id: track.id,
          title: track.title,
          cover_art_url: track.cover_art_url,
          artist_name: track.artist?.display_name,
        },
        new_balance_cents: newBalance,
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