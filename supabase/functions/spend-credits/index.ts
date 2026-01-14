import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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

    // Get track details
    const { data: track, error: trackError } = await supabaseClient
      .from("tracks")
      .select("*, artist:profiles!tracks_artist_id_fkey(id, display_name, stripe_account_id, stripe_payouts_enabled)")
      .eq("id", track_id)
      .single();

    if (trackError || !track) {
      throw new Error("Track not found");
    }

    const priceCents = Math.round(track.price * 100); // Convert dollars to cents
    logStep("Track found", { title: track.title, price_cents: priceCents });

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance_cents < priceCents) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          balance_cents: wallet.balance_cents,
          required_cents: priceCents,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    logStep("Wallet balance sufficient", { balance: wallet.balance_cents, price: priceCents });

    // Calculate revenue split
    const platformFeeCents = Math.ceil(priceCents * (PLATFORM_FEE_PERCENT / 100));
    const artistPayoutCents = priceCents - platformFeeCents;

    logStep("Revenue split calculated", { 
      gross: priceCents, 
      platform_fee: platformFeeCents, 
      artist_payout: artistPayoutCents 
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
      throw new Error("All editions have been sold");
    }

    // Start transaction: deduct credits, create purchase, record earnings
    
    // 1. Deduct credits from wallet
    const { error: deductError } = await supabaseClient
      .from("credit_wallets")
      .update({ balance_cents: wallet.balance_cents - priceCents })
      .eq("user_id", userId);

    if (deductError) {
      throw new Error("Failed to deduct credits");
    }

    // 2. Create purchase record
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
      // Rollback: restore credits
      await supabaseClient
        .from("credit_wallets")
        .update({ balance_cents: wallet.balance_cents })
        .eq("user_id", userId);
      throw new Error("Failed to create purchase record");
    }

    // 3. Record credit transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        type: "spend",
        amount_cents: -priceCents,
        reference_id: purchase.id,
        description: `Purchased: ${track.title}`,
      });

    // 4. Record artist earnings
    const { data: earnings, error: earningsError } = await supabaseClient
      .from("artist_earnings")
      .insert({
        artist_id: track.artist_id,
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

    // 5. Update track editions_sold count
    await supabaseClient
      .from("tracks")
      .update({ editions_sold: editionNumber })
      .eq("id", track_id);

    logStep("Purchase completed", { 
      purchase_id: purchase.id, 
      edition_number: editionNumber,
      earnings_id: earnings?.id,
    });

    // 6. If artist has Stripe Connect, initiate transfer
    if (track.artist?.stripe_account_id && track.artist?.stripe_payouts_enabled) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2023-10-16",
        });

        // Note: This would require having funds in your Stripe account
        // For now, we just record the earnings for later payout
        logStep("Artist has Stripe Connect - earnings recorded for payout", {
          stripe_account_id: track.artist.stripe_account_id,
          payout_cents: artistPayoutCents,
        });
      } catch (stripeError) {
        logStep("Stripe transfer skipped", { 
          error: stripeError instanceof Error ? stripeError.message : "Unknown" 
        });
      }
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
        new_balance_cents: wallet.balance_cents - priceCents,
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
