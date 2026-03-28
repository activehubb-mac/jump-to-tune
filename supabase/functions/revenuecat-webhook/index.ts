import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const s = details !== undefined ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${s}`);
};

type Tier = "fan" | "artist" | "label";

const TIER_CREDITS: Record<Tier, number> = {
  fan: 300,
  artist: 800,
  label: 2000,
};

function mapProductToTier(productId: string | null | undefined, entitlementIds: string[] | null | undefined): Tier | null {
  if (entitlementIds?.length) {
    for (const id of entitlementIds) {
      const k = id.toLowerCase();
      if (k === "fan") return "fan";
      if (k === "artist") return "artist";
      if (k === "label") return "label";
    }
  }
  if (!productId) return null;
  const base = productId.split(":")[0];
  if (base === "jumtunes_fan_monthly" || productId === "jumtunes_fan_monthly") return "fan";
  if (base === "jumtunes_artist_monthly" || productId === "jumtunes_artist_monthly") return "artist";
  if (base === "jumtunes_label_monthly" || productId === "jumtunes_label_monthly") return "label";
  return null;
}

function mapPeriodToStatus(periodType: string | undefined): "trialing" | "active" | "past_due" {
  if (periodType === "TRIAL" || periodType === "INTRO") return "trialing";
  return "active";
}

async function grantTierCreditsIfNew(
  supabase: SupabaseClient,
  userId: string,
  tier: Tier,
  eventId: string,
  source: string
): Promise<void> {
  const { data: dup } = await supabase
    .from("ai_credit_usage")
    .select("id")
    .eq("user_id", userId)
    .contains("metadata", { revenuecat_event_id: eventId })
    .maybeSingle();

  if (dup) {
    logStep("Skip duplicate credit grant", { eventId });
    return;
  }

  const credits = TIER_CREDITS[tier];
  if (credits <= 0) return;

  const { data: addResult, error: addError } = await supabase.rpc("add_ai_credits", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (addError) {
    logStep("add_ai_credits failed", { error: addError.message });
    return;
  }

  await supabase.from("ai_credit_usage").insert({
    user_id: userId,
    action: source,
    credits_used: -credits,
    metadata: { revenuecat_event_id: eventId, tier },
  });

  logStep("Tier credits granted", { userId, tier, credits, newBalance: addResult?.new_credits });

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "credits_refreshed",
    title: "Subscription credits added",
    message: `${credits} AI credits have been added to your wallet.`,
    metadata: { credits, tier, source: "revenuecat" },
  });
}

async function syncUserRole(
  supabase: SupabaseClient,
  userId: string,
  tier: Tier,
  previousRole: string
): Promise<void> {
  if (previousRole === "artist" && tier === "label") {
    const { data: migratedTracks, error: trackMigrationError } = await supabase
      .from("tracks")
      .update({ label_id: userId })
      .eq("artist_id", userId)
      .is("label_id", null)
      .select("id");

    if (trackMigrationError) logStep("Track migration error", { error: trackMigrationError });
    else logStep("Tracks migrated to label", { count: migratedTracks?.length ?? 0 });
  }

  if (previousRole === "label" && tier === "artist") {
    await supabase
      .from("label_roster")
      .update({ status: "released" })
      .eq("label_id", userId)
      .eq("status", "active");

    const { data: revertedTracks, error: trackRevertError } = await supabase
      .from("tracks")
      .update({ label_id: null })
      .eq("label_id", userId)
      .eq("artist_id", userId)
      .select("id");

    if (trackRevertError) logStep("Track revert error", { error: trackRevertError });
    else logStep("Tracks reverted to artist", { count: revertedTracks?.length ?? 0 });
  }

  if (previousRole !== tier) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "role_change",
      title: "Plan changed",
      message: `Your plan is now ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
      metadata: {
        previous_role: previousRole,
        new_role: tier,
        source: "revenuecat",
      },
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedAuth = (Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "").trim();
  if (expectedAuth) {
    const auth = (req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "").trim();
    const bearer = expectedAuth.startsWith("Bearer ") ? expectedAuth : `Bearer ${expectedAuth}`;
    const ok =
      auth === expectedAuth ||
      auth === bearer ||
      (expectedAuth.startsWith("Bearer ") && auth === expectedAuth.slice(7).trim());
    if (!ok) {
      logStep("Unauthorized webhook");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    logStep("Warning: REVENUECAT_WEBHOOK_AUTH not set — webhook is public");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const raw = await req.json();
    const event = raw.event ?? raw;
    const type = event.type as string;
    const eventId = event.id as string | undefined;

    logStep("Event received", { type, eventId, app_user_id: event.app_user_id });

    if (type === "TEST") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = event.app_user_id as string | undefined;
    if (!userId || !eventId) {
      logStep("Missing app_user_id or event id");
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = event.product_id as string | undefined;
    const entitlementIds = event.entitlement_ids as string[] | undefined;
    const tier = mapProductToTier(productId, entitlementIds);

    const purchasedAtMs = event.purchased_at_ms as number | undefined;
    const expirationAtMs = event.expiration_at_ms as number | undefined;
    const periodType = event.period_type as string | undefined;
    const originalTxId = event.original_transaction_id as string | undefined;

    const periodStart = purchasedAtMs ? new Date(purchasedAtMs).toISOString() : new Date().toISOString();
    const periodEnd = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
    const trialEndsAt = periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (type === "INITIAL_PURCHASE" || type === "RENEWAL" || type === "UNCANCELLATION") {
      if (!tier) {
        logStep("No tier mapping for product", { productId, entitlementIds });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .neq("role", "admin")
        .maybeSingle();

      const previousRole = (existingRole?.role as string) || "fan";

      const status = mapPeriodToStatus(periodType);

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      const { error: subErr } = await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          tier,
          status,
          trial_ends_at: trialEndsAt,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          stripe_subscription_id: existingSub?.stripe_subscription_id ?? null,
          stripe_customer_id: existingSub?.stripe_customer_id ?? null,
          revenuecat_original_transaction_id: originalTxId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (subErr) logStep("subscriptions upsert error", { error: subErr });

      if (existingRole) {
        await supabase.from("user_roles").update({ role: tier }).eq("user_id", userId);
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: tier });
      }

      await syncUserRole(supabase, userId, tier, previousRole);

      if (type === "INITIAL_PURCHASE" || type === "RENEWAL") {
        const creditSource = type === "INITIAL_PURCHASE" ? "revenuecat_initial_purchase" : "revenuecat_renewal";
        await grantTierCreditsIfNew(supabase, userId, tier, eventId, creditSource);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "PRODUCT_CHANGE") {
      const newProductId = (event.new_product_id as string | undefined) || productId;
      const newTier = mapProductToTier(newProductId, entitlementIds);
      if (!newTier) {
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .neq("role", "admin")
        .maybeSingle();
      const previousRole = (existingRole?.role as string) || "fan";

      const status = mapPeriodToStatus(periodType);
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          tier: newTier,
          status,
          trial_ends_at: trialEndsAt,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          stripe_subscription_id: existingSub?.stripe_subscription_id ?? null,
          stripe_customer_id: existingSub?.stripe_customer_id ?? null,
          revenuecat_original_transaction_id: originalTxId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      await supabase.from("user_roles").update({ role: newTier }).eq("user_id", userId);
      await syncUserRole(supabase, userId, newTier, previousRole);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "CANCELLATION") {
      if (periodEnd) {
        await supabase
          .from("subscriptions")
          .update({
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "EXPIRATION") {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          revenuecat_original_transaction_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "BILLING_ISSUE") {
      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, ignored_type: type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
