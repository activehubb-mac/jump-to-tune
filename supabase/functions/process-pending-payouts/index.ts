import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-PENDING-PAYOUTS] ${step}${detailsStr}`);
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

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    logStep("Admin verified", { userId: userData.user.id });

    // Get all pending earnings
    const { data: pendingEarnings, error: earningsError } = await supabaseClient
      .from("artist_earnings")
      .select("*")
      .eq("status", "pending");

    if (earningsError) {
      throw new Error(`Failed to fetch pending earnings: ${earningsError.message}`);
    }

    if (!pendingEarnings || pendingEarnings.length === 0) {
      logStep("No pending payouts to process");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending payouts to process",
          processed: 0,
          failed: 0,
          skipped: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Found pending earnings", { count: pendingEarnings.length });

    // Get unique artist IDs
    const artistIds = [...new Set(pendingEarnings.map(e => e.artist_id))];

    // Fetch all artist profiles with Stripe info
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, stripe_account_id, stripe_payouts_enabled, display_name")
      .in("id", artistIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Create a map for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        earnings_id: string;
        artist_id: string;
        artist_name: string | null;
        amount_cents: number;
        status: "paid" | "failed" | "skipped";
        reason?: string;
        transfer_id?: string;
      }>,
    };

    // Process each pending earning
    for (const earning of pendingEarnings) {
      const profile = profileMap.get(earning.artist_id);
      const artistName = profile?.display_name || "Unknown";

      // Skip if no Stripe Connect or payouts not enabled
      if (!profile?.stripe_account_id || !profile?.stripe_payouts_enabled) {
        results.skipped++;
        results.details.push({
          earnings_id: earning.id,
          artist_id: earning.artist_id,
          artist_name: artistName,
          amount_cents: earning.artist_payout_cents,
          status: "skipped",
          reason: !profile?.stripe_account_id 
            ? "No Stripe Connect account" 
            : "Payouts not enabled",
        });
        continue;
      }

      // Attempt transfer
      try {
        logStep("Creating transfer", {
          artist: artistName,
          amount_cents: earning.artist_payout_cents,
          stripe_account: profile.stripe_account_id,
        });

        const transfer = await stripe.transfers.create({
          amount: earning.artist_payout_cents,
          currency: "usd",
          destination: profile.stripe_account_id,
          transfer_group: `backlog_payout_${earning.id}`,
          metadata: {
            earnings_id: earning.id,
            purchase_id: earning.purchase_id,
            artist_id: earning.artist_id,
            processed_by: "admin_batch",
          },
        });

        // Update earnings record
        await supabaseClient
          .from("artist_earnings")
          .update({
            stripe_transfer_id: transfer.id,
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", earning.id);

        results.processed++;
        results.details.push({
          earnings_id: earning.id,
          artist_id: earning.artist_id,
          artist_name: artistName,
          amount_cents: earning.artist_payout_cents,
          status: "paid",
          transfer_id: transfer.id,
        });

        logStep("Transfer successful", { 
          transfer_id: transfer.id, 
          artist: artistName,
        });

        // Send payout email (non-blocking)
        fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-payout-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              artistId: earning.artist_id,
              payoutAmountCents: earning.artist_payout_cents,
              status: "paid",
            }),
          }
        ).catch(err => logStep("Payout email error", { error: err.message }));

      } catch (transferError) {
        const errorMessage = transferError instanceof Error ? transferError.message : "Unknown error";
        
        logStep("Transfer failed", { 
          error: errorMessage, 
          artist: artistName,
        });

        // Mark as failed
        await supabaseClient
          .from("artist_earnings")
          .update({ status: "failed" })
          .eq("id", earning.id);

        results.failed++;
        results.details.push({
          earnings_id: earning.id,
          artist_id: earning.artist_id,
          artist_name: artistName,
          amount_cents: earning.artist_payout_cents,
          status: "failed",
          reason: errorMessage,
        });
      }
    }

    logStep("Processing complete", {
      processed: results.processed,
      failed: results.failed,
      skipped: results.skipped,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} payouts, ${results.failed} failed, ${results.skipped} skipped`,
        ...results,
      }),
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
