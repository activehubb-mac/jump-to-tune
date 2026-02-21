import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) =>
  console.log(`[EVALUATE-BADGES] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Evaluating badges", { user_id });

    // ── Gather ownership data ──────────────────────────────────────────
    // Track purchases (music ownership)
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, track_id, edition_number, purchased_at, track:tracks(artist_id, album_id)")
      .eq("user_id", user_id);

    // Store orders (drop ownership) — only completed/paid
    const { data: orders } = await supabase
      .from("store_orders")
      .select("id, product_id, artist_id, edition_number, status, product:store_products(parent_product_id, title)")
      .eq("buyer_id", user_id)
      .in("status", ["completed", "paid", "pending"]);

    const activePurchases = purchases || [];
    const activeOrders = orders || [];

    log("Ownership data", { purchases: activePurchases.length, orders: activeOrders.length });

    // Total ownership count (both tracks and store products)
    const totalOwnership = activePurchases.length + activeOrders.length;

    // ── Compute desired badge set ──────────────────────────────────────
    type BadgeSpec = {
      badge_key: string;
      badge_type: "platform" | "artist";
      tier: "gold" | "silver";
      artist_id: string | null;
      product_id: string | null;
      metadata: Record<string, any>;
    };

    const desiredBadges: BadgeSpec[] = [];

    // ── PLATFORM BADGES ────────────────────────────────────────────────

    // First Purchase
    if (totalOwnership >= 1) {
      desiredBadges.push({
        badge_key: "first_purchase",
        badge_type: "platform",
        tier: "gold",
        artist_id: null,
        product_id: null,
        metadata: { label: "First Purchase" },
      });
    }

    // Repeat Buyer tiers
    const repeatTiers = [
      { threshold: 10, key: "repeat_buyer_10", label: "10 Drops Collector" },
      { threshold: 5, key: "repeat_buyer_5", label: "5 Drops Collector" },
      { threshold: 3, key: "repeat_buyer_3", label: "3 Drops Collector" },
    ];
    for (const rt of repeatTiers) {
      if (totalOwnership >= rt.threshold) {
        desiredBadges.push({
          badge_key: rt.key,
          badge_type: "platform",
          tier: "gold",
          artist_id: null,
          product_id: null,
          metadata: { label: rt.label, count: totalOwnership },
        });
        break; // Only highest tier
      }
    }

    // Early Adopter (permanent — check threshold)
    const { data: eaSetting } = await supabase
      .from("badge_settings")
      .select("setting_value")
      .eq("setting_key", "early_adopter_threshold")
      .single();

    const eaMax = (eaSetting?.setting_value as any)?.max_users ?? 100;

    // Check if user already has it (permanent)
    const { data: existingEA } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", user_id)
      .eq("badge_key", "early_adopter")
      .maybeSingle();

    if (existingEA) {
      // Keep it — permanent
      desiredBadges.push({
        badge_key: "early_adopter",
        badge_type: "platform",
        tier: "gold",
        artist_id: null,
        product_id: null,
        metadata: { label: "Early Adopter", permanent: true },
      });
    } else if (totalOwnership >= 1) {
      // Count how many unique users have purchases
      const { count: totalBuyers } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("badge_key", "early_adopter");

      if ((totalBuyers || 0) < eaMax) {
        desiredBadges.push({
          badge_key: "early_adopter",
          badge_type: "platform",
          tier: "gold",
          artist_id: null,
          product_id: null,
          metadata: { label: "Early Adopter", permanent: true },
        });
      }
    }

    // ── ARTIST BADGES ──────────────────────────────────────────────────

    // Group store orders by artist
    const ordersByArtist = new Map<string, typeof activeOrders>();
    for (const order of activeOrders) {
      const list = ordersByArtist.get(order.artist_id) || [];
      list.push(order);
      ordersByArtist.set(order.artist_id, list);
    }

    // Group track purchases by artist
    for (const purchase of activePurchases) {
      const artistId = (purchase.track as any)?.artist_id;
      if (!artistId) continue;
      const list = ordersByArtist.get(artistId) || [];
      // Add as a pseudo-order for counting
      list.push({ ...purchase, artist_id: artistId, product_id: purchase.track_id, product: null } as any);
      ordersByArtist.set(artistId, list);
    }

    for (const [artistId, artistOrders] of ordersByArtist) {
      // Drop Owner — one per product
      for (const order of artistOrders) {
        if (order.product_id) {
          desiredBadges.push({
            badge_key: "drop_owner",
            badge_type: "artist",
            tier: "silver",
            artist_id: artistId,
            product_id: order.product_id,
            metadata: { label: "Drop Owner" },
          });
        }
      }

      // Version badges (V1/V2/V3 holder) — for store orders with parent tracking
      for (const order of activeOrders.filter((o) => o.artist_id === artistId)) {
        const parentId = (order.product as any)?.parent_product_id;
        if (!parentId && order.edition_number === 1) {
          // Original product, edition #1 = V1 Holder
          desiredBadges.push({
            badge_key: "v1_holder",
            badge_type: "artist",
            tier: "silver",
            artist_id: artistId,
            product_id: order.product_id,
            metadata: { label: "V1 Holder" },
          });
        }
      }

      // Multi-drop supporter
      const uniqueProducts = new Set(artistOrders.map((o) => o.product_id).filter(Boolean));
      const dropCount = uniqueProducts.size;

      const multiTiers = [
        { threshold: 10, key: "multi_drop_10", label: "10 Drop Supporter" },
        { threshold: 5, key: "multi_drop_5", label: "5 Drop Supporter" },
        { threshold: 3, key: "multi_drop_3", label: "3 Drop Supporter" },
      ];
      for (const mt of multiTiers) {
        if (dropCount >= mt.threshold) {
          desiredBadges.push({
            badge_key: mt.key,
            badge_type: "artist",
            tier: "silver",
            artist_id: artistId,
            product_id: null,
            metadata: { label: mt.label, count: dropCount },
          });
          break; // Only highest tier
        }
      }
    }

    // ── Reconcile with database ────────────────────────────────────────
    // Fetch existing badges
    const { data: existingBadges } = await supabase
      .from("user_badges")
      .select("id, badge_key, artist_id, product_id, metadata")
      .eq("user_id", user_id);

    const existing = existingBadges || [];

    // Build lookup key
    const badgeKey = (b: { badge_key: string; artist_id: string | null; product_id: string | null }) =>
      `${b.badge_key}|${b.artist_id || ""}|${b.product_id || ""}`;

    const existingSet = new Set(existing.map(badgeKey));
    const desiredSet = new Set(desiredBadges.map(badgeKey));

    // Badges to add
    const toAdd = desiredBadges.filter((b) => !existingSet.has(badgeKey(b)));

    // Badges to remove (except permanent ones like early_adopter)
    const toRemove = existing.filter((b) => {
      if ((b.metadata as any)?.permanent) return false;
      return !desiredSet.has(badgeKey(b));
    });

    log("Badge reconciliation", { toAdd: toAdd.length, toRemove: toRemove.length });

    // Insert new badges
    if (toAdd.length > 0) {
      const rows = toAdd.map((b) => ({
        user_id,
        badge_key: b.badge_key,
        badge_type: b.badge_type,
        tier: b.tier,
        artist_id: b.artist_id,
        product_id: b.product_id,
        metadata: b.metadata,
      }));
      const { error: insertError } = await supabase.from("user_badges").upsert(rows, {
        onConflict: "user_id,badge_key,artist_id,product_id",
      });
      if (insertError) log("Insert error", { error: insertError.message });
    }

    // Remove revoked badges
    if (toRemove.length > 0) {
      const idsToRemove = toRemove.map((b) => b.id);
      const { error: deleteError } = await supabase
        .from("user_badges")
        .delete()
        .in("id", idsToRemove);
      if (deleteError) log("Delete error", { error: deleteError.message });
    }

    // Notify on new badges
    for (const badge of toAdd) {
      const label = badge.metadata?.label || badge.badge_key;
      await supabase.from("notifications").insert({
        user_id,
        type: "badge_earned",
        title: `Badge Earned: ${label}`,
        message: `You've earned the "${label}" badge!`,
        metadata: { badge_key: badge.badge_key, tier: badge.tier, artist_id: badge.artist_id },
      });
    }

    const finalBadges = desiredBadges.length;
    log("Evaluation complete", { total: finalBadges, added: toAdd.length, removed: toRemove.length });

    return new Response(
      JSON.stringify({ success: true, badges: finalBadges, added: toAdd.length, removed: toRemove.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    log("Error", { error: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
