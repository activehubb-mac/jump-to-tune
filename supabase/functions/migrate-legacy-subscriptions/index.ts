import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MIGRATE-LEGACY] ${step}${detailsStr}`);
};

// Legacy product IDs to migrate
const LEGACY_PRODUCT_IDS = [
  "prod_U64JhzLBj2FgX6", // Creator
  "prod_U64MIFgGOplcaN", // Creator Pro
  "prod_U64OF1AShTZIam", // Label/Studio
];

// 1 USD = 10 AI credits
const USD_TO_CREDITS = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Migration function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Admin access required");

    logStep("Admin verified", { adminId: userData.user.id });

    // Check for dry_run mode
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    logStep("Mode", { dryRun });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-11-17.clover",
    });

    const results = {
      total_subscriptions_cancelled: 0,
      total_users_migrated: 0,
      total_credits_converted: 0,
      total_wallet_usd_converted: 0,
      skipped_already_migrated: 0,
      skipped_fans: 0,
      errors: [] as string[],
      details: [] as Array<{
        user_id: string;
        email: string | null;
        old_tier: string;
        stripe_sub_id: string;
        wallet_balance_cents: number;
        credits_added: number;
        status: string;
      }>,
    };

    // STEP 1: Fetch all active Stripe subscriptions for legacy products
    logStep("Step 1: Fetching active subscriptions from Stripe");

    const allSubscriptions: Stripe.Subscription[] = [];

    for (const productId of LEGACY_PRODUCT_IDS) {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Stripe.SubscriptionListParams = {
          status: "active",
          limit: 100,
          expand: ["data.customer"],
        };
        if (startingAfter) params.starting_after = startingAfter;

        const subs = await stripe.subscriptions.list(params);

        // Filter by product ID
        for (const sub of subs.data) {
          const hasProduct = sub.items.data.some(
            (item) => item.price.product === productId
          );
          if (hasProduct) {
            allSubscriptions.push(sub);
          }
        }

        hasMore = subs.has_more;
        if (subs.data.length > 0) {
          startingAfter = subs.data[subs.data.length - 1].id;
        }
      }
    }

    logStep("Found active subscriptions", { count: allSubscriptions.length });

    // Deduplicate by subscription ID
    const uniqueSubs = new Map<string, Stripe.Subscription>();
    for (const sub of allSubscriptions) {
      uniqueSubs.set(sub.id, sub);
    }

    const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const [subId, subscription] of uniqueSubs) {
      const customer = subscription.customer as Stripe.Customer;
      const customerEmail = customer.email;

      // Find user by email
      let userId: string | null = null;

      if (customerEmail) {
        const { data: users } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        if (users) userId = users.id;
      }

      // Fallback: check subscriptions table for stripe_subscription_id
      if (!userId) {
        const { data: localSub } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();

        if (localSub) userId = localSub.user_id;
      }

      if (!userId) {
        results.errors.push(`No user found for subscription ${subId} (email: ${customerEmail})`);
        continue;
      }

      // ═══════════════════════════════════════════════════════════════
      // FAN SAFEGUARD: Skip users with fan role — fans are free users
      // and must never be affected by the creator migration.
      // ═══════════════════════════════════════════════════════════════
      const { data: userRole } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .neq("role", "admin")
        .maybeSingle();

      if (userRole?.role === "fan") {
        results.skipped_fans = (results.skipped_fans || 0) + 1;
        logStep("SKIPPED fan account — no migration applied", { userId, email: customerEmail });
        continue;
      }

      // Check if already migrated
      const { data: existingLog } = await supabaseClient
        .from("migration_logs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingLog) {
        results.skipped_already_migrated++;
        logStep("Skipping already migrated user", { userId });
        continue;
      }

      // Determine old tier
      const productId = subscription.items.data[0]?.price.product as string;
      const oldTier = productId === "prod_U64JhzLBj2FgX6" ? "creator"
        : productId === "prod_U64MIFgGOplcaN" ? "creator_pro"
        : productId === "prod_U64OF1AShTZIam" ? "label"
        : "unknown";

      try {
        // STEP 2: Cancel subscription in Stripe
        if (!dryRun) {
          await stripe.subscriptions.cancel(subId, {
            invoice_now: false,
          });
          logStep("Cancelled Stripe subscription", { subId, userId });
        }

        // STEP 4: Convert wallet balance to AI credits
        let walletBalanceCents = 0;
        let creditsFromWallet = 0;

        const { data: wallet } = await supabaseClient
          .from("credit_wallets")
          .select("id, balance_cents, ai_credits")
          .eq("user_id", userId)
          .maybeSingle();

        if (wallet && wallet.balance_cents > 0) {
          // STEP 7: Only convert internal wallet balance (balance_cents), NOT artist earnings
          walletBalanceCents = wallet.balance_cents;
          const usdAmount = walletBalanceCents / 100;
          creditsFromWallet = Math.floor(usdAmount * USD_TO_CREDITS);

          if (!dryRun) {
            // Add AI credits and zero out USD balance
            await supabaseClient
              .from("credit_wallets")
              .update({
                ai_credits: (wallet.ai_credits || 0) + creditsFromWallet,
                balance_cents: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", wallet.id);

            logStep("Converted wallet balance", {
              userId,
              oldBalanceCents: walletBalanceCents,
              creditsAdded: creditsFromWallet,
            });
          }
        }

        // STEP 5: Create AI wallet if missing
        if (!wallet && !dryRun) {
          await supabaseClient
            .from("credit_wallets")
            .insert({
              user_id: userId,
              balance_cents: 0,
              ai_credits: 0,
            });
          logStep("Created AI wallet for user", { userId });
        }

        // STEP 3: Migrate user account
        if (!dryRun) {
          await supabaseClient
            .from("subscriptions")
            .update({
              status: "trialing",
              tier: "fan",
              trial_ends_at: trialExpiresAt,
              current_period_end: trialExpiresAt,
              stripe_subscription_id: null,
              founding_user: true,
              legacy_subscription_ended: true,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          logStep("Migrated user to trial", { userId });
        }

        // STEP 6: Log the migration
        if (!dryRun) {
          await supabaseClient.from("migration_logs").insert({
            user_id: userId,
            old_wallet_amount: walletBalanceCents,
            credits_added: creditsFromWallet,
            old_subscription_tier: oldTier,
            stripe_subscription_id: subId,
            notes: `Legacy ${oldTier} subscription cancelled. Wallet $${(walletBalanceCents / 100).toFixed(2)} converted to ${creditsFromWallet} AI credits.`,
          });
        }

        results.total_subscriptions_cancelled++;
        results.total_users_migrated++;
        results.total_credits_converted += creditsFromWallet;
        results.total_wallet_usd_converted += walletBalanceCents;

        results.details.push({
          user_id: userId,
          email: customerEmail,
          old_tier: oldTier,
          stripe_sub_id: subId,
          wallet_balance_cents: walletBalanceCents,
          credits_added: creditsFromWallet,
          status: dryRun ? "dry_run" : "migrated",
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`Failed for user ${userId} (sub ${subId}): ${msg}`);
        logStep("Migration error for user", { userId, error: msg });
      }
    }

    logStep("Migration complete", {
      cancelled: results.total_subscriptions_cancelled,
      migrated: results.total_users_migrated,
      credits: results.total_credits_converted,
      skipped: results.skipped_already_migrated,
      errors: results.errors.length,
    });

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      ...results,
      total_wallet_usd_converted_display: `$${(results.total_wallet_usd_converted / 100).toFixed(2)}`,
    }), {
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
