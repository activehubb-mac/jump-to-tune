import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_THRESHOLDS = [
  { level: "founding_superfan", points: 1000 },
  { level: "elite", points: 500 },
  { level: "insider", points: 150 },
  { level: "supporter", points: 50 },
  { level: "listener", points: 0 },
];

function getLevelFromPoints(points: number): string {
  for (const t of LEVEL_THRESHOLDS) {
    if (points >= t.points) return t.level;
  }
  return "listener";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), { status: 400, headers: corsHeaders });
    }

    // Verify artist owns this order
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await adminClient
      .from("store_orders")
      .select("*")
      .eq("id", orderId)
      .eq("artist_id", userId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found or access denied" }), { status: 404, headers: corsHeaders });
    }

    if (order.status === "refunded") {
      return new Response(JSON.stringify({ error: "Order already refunded" }), { status: 400, headers: corsHeaders });
    }

    if (!order.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "No payment intent found for this order" }), { status: 400, headers: corsHeaders });
    }

    // Process refund via Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id });

    // Update order status
    await adminClient
      .from("store_orders")
      .update({ status: "refunded" })
      .eq("id", orderId);

    // ── RESTORE INVENTORY (defense-in-depth) ─────────────────────────────
    const { data: restoreResult } = await adminClient.rpc(
      "restore_inventory_atomic",
      { p_product_id: order.product_id, p_quantity: 1 }
    );
    console.log("[REFUND] Inventory restored", restoreResult);

    // ── SUBTRACT LOYALTY POINTS (defense-in-depth) ───────────────────────
    const { data: loyaltyRow } = await adminClient
      .from("fan_loyalty")
      .select("id, points, level")
      .eq("fan_id", order.buyer_id)
      .eq("artist_id", order.artist_id)
      .maybeSingle();

    if (loyaltyRow) {
      const newPoints = Math.max(loyaltyRow.points - 10, 0);
      const newLevel = getLevelFromPoints(newPoints);
      await adminClient
        .from("fan_loyalty")
        .update({ points: newPoints, level: newLevel })
        .eq("id", loyaltyRow.id);
      console.log("[REFUND] Loyalty points adjusted", { newPoints, newLevel });
    }

    // ── RE-EVALUATE BADGES (non-blocking) ──────────────────────────────
    try {
      fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-badges`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ user_id: order.buyer_id }),
        }
      ).then(res => {
        if (!res.ok) console.log("[REFUND] Badge re-evaluation failed", res.status);
        else console.log("[REFUND] Badge re-evaluation triggered");
      }).catch(err => console.log("[REFUND] Badge error", err.message));
    } catch (_) { /* non-blocking */ }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
