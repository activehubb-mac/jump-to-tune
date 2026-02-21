import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) =>
  console.log(`[BACKGROUND-JOBS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const jobType = body.job_type as string | undefined;

    // If called with specific job_type, run that job directly
    if (jobType) {
      log("Direct job execution", { jobType });
      const result = await executeJob(supabase, jobType, body.payload || {});
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Otherwise, process pending jobs from queue
    const { data: jobs, error: fetchError } = await supabase
      .from("job_queue")
      .select("*")
      .eq("status", "pending")
      .lte("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      log("Error fetching jobs", { error: fetchError.message });
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Processing jobs", { count: jobs?.length || 0 });

    const results: any[] = [];
    for (const job of jobs || []) {
      // Mark as processing
      await supabase
        .from("job_queue")
        .update({ status: "processing", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq("id", job.id);

      try {
        const result = await executeJob(supabase, job.job_type, job.payload as Record<string, any>);
        await supabase
          .from("job_queue")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);
        results.push({ id: job.id, job_type: job.job_type, status: "completed" });
        log("Job completed", { id: job.id, type: job.job_type });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const newStatus = job.attempts + 1 >= job.max_attempts ? "failed" : "pending";
        await supabase
          .from("job_queue")
          .update({ status: newStatus, error: errorMsg })
          .eq("id", job.id);
        results.push({ id: job.id, job_type: job.job_type, status: newStatus, error: errorMsg });
        log("Job failed", { id: job.id, type: job.job_type, error: errorMsg, willRetry: newStatus === "pending" });
      }
    }

    // Cleanup old completed/failed jobs (>24h)
    await supabase
      .from("job_queue")
      .delete()
      .in("status", ["completed", "failed"])
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Cleanup old rate limit entries
    await supabase.rpc("cleanup_rate_limits").catch(() => {});

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("Error", { error: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── JOB EXECUTORS ──────────────────────────────────────────────────────────

async function executeJob(
  supabase: ReturnType<typeof createClient>,
  jobType: string,
  payload: Record<string, any>,
): Promise<any> {
  switch (jobType) {
    case "refresh_trending":
      return refreshTrending(supabase);
    case "refresh_analytics":
      return refreshAnalytics(supabase, payload.artist_id);
    case "evaluate_badges":
      return evaluateBadges(supabase, payload.user_id);
    case "refresh_all_analytics":
      return refreshAllAnalytics(supabase);
    case "send_notification":
      return sendNotification(supabase, payload);
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

// ── TRENDING REFRESH ───────────────────────────────────────────────────────

async function refreshTrending(supabase: ReturnType<typeof createClient>) {
  log("Refreshing trending cache");

  // Get active products with waitlist counts
  const { data: products } = await supabase
    .from("store_products")
    .select("id, title, price_cents, inventory_sold, inventory_limit, status, image_url, artist_id, created_at, is_featured, scheduled_release_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!products || products.length === 0) {
    await upsertCache(supabase, "global", []);
    return { cached: 0 };
  }

  // Get waitlist counts in bulk
  const productIds = products.map((p) => p.id);
  const { data: waitlistData } = await supabase
    .from("drop_waitlists")
    .select("product_id")
    .in("product_id", productIds);

  const waitlistCounts = new Map<string, number>();
  (waitlistData || []).forEach((w) => {
    waitlistCounts.set(w.product_id, (waitlistCounts.get(w.product_id) || 0) + 1);
  });

  // Get recent purchase velocity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recentOrders } = await supabase
    .from("store_orders")
    .select("product_id")
    .in("product_id", productIds)
    .in("status", ["completed", "paid"])
    .gte("created_at", sevenDaysAgo);

  const salesVelocity = new Map<string, number>();
  (recentOrders || []).forEach((o) => {
    salesVelocity.set(o.product_id, (salesVelocity.get(o.product_id) || 0) + 1);
  });

  // Get admin-pinned/featured content
  const { data: featured } = await supabase
    .from("featured_content")
    .select("content_id, priority")
    .eq("content_type", "track")
    .eq("is_active", true);

  const pinnedMap = new Map((featured || []).map((f) => [f.content_id, f.priority]));

  // Score and rank — formula is NEVER exposed to frontend
  const scored = products.map((p) => {
    const limit = p.inventory_limit || 1000;
    const demandRatio = p.inventory_sold / limit;
    const waitlistCount = waitlistCounts.get(p.id) || 0;
    const waitlistDemand = limit > 0 ? waitlistCount / limit : 0;
    const velocity = salesVelocity.get(p.id) || 0;
    const recencyBonus = Math.max(0, 1 - (Date.now() - new Date(p.created_at).getTime()) / (30 * 86400000));
    const pinnedPriority = pinnedMap.get(p.id) || 0;

    const _score =
      demandRatio * 0.3 +
      waitlistDemand * 0.2 +
      (velocity / 10) * 0.2 +
      recencyBonus * 0.15 +
      (p.is_featured ? 0.15 : 0) +
      pinnedPriority * 10; // Admin pins dominate

    // Strip score, return clean data
    return {
      id: p.id,
      title: p.title,
      price_cents: p.price_cents,
      inventory_sold: p.inventory_sold,
      inventory_limit: p.inventory_limit,
      status: p.status,
      image_url: p.image_url,
      artist_id: p.artist_id,
      created_at: p.created_at,
      is_featured: p.is_featured,
      waitlist_count: waitlistCount,
      _score,
    };
  });

  scored.sort((a, b) => b._score - a._score);

  // Strip internal score
  const trending = scored.map(({ _score, ...rest }) => rest).slice(0, 50);

  await upsertCache(supabase, "global", trending);
  log("Trending cache refreshed", { items: trending.length });
  return { cached: trending.length };
}

async function upsertCache(supabase: ReturnType<typeof createClient>, key: string, data: any) {
  await supabase
    .from("trending_cache")
    .upsert(
      {
        cache_key: key,
        data,
        computed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
}

// ── ANALYTICS REFRESH ──────────────────────────────────────────────────────

async function refreshAnalytics(supabase: ReturnType<typeof createClient>, artistId: string) {
  if (!artistId) throw new Error("artist_id required for analytics refresh");

  log("Refreshing analytics", { artistId });

  const [followers, earnings, orders, products] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", artistId),
    supabase
      .from("artist_earnings")
      .select("gross_amount_cents, artist_payout_cents, platform_fee_cents")
      .eq("artist_id", artistId),
    supabase
      .from("store_orders")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId)
      .in("status", ["completed", "paid"]),
    supabase
      .from("store_products")
      .select("id, title, price_cents, inventory_sold, inventory_limit, status")
      .eq("artist_id", artistId),
  ]);

  const totalEarnings = (earnings.data || []).reduce((s, e) => s + e.artist_payout_cents, 0);
  const totalGross = (earnings.data || []).reduce((s, e) => s + e.gross_amount_cents, 0);

  const analytics = {
    follower_count: followers.count || 0,
    total_earnings_cents: totalEarnings,
    total_gross_cents: totalGross,
    total_orders: orders.count || 0,
    products: products.data || [],
  };

  await supabase
    .from("analytics_cache")
    .upsert(
      {
        entity_id: artistId,
        entity_type: "artist",
        data: analytics,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "entity_id,entity_type" },
    );

  log("Analytics cached", { artistId });
  return analytics;
}

async function refreshAllAnalytics(supabase: ReturnType<typeof createClient>) {
  // Get all artists with stores
  const { data: artists } = await supabase
    .from("artist_stores")
    .select("artist_id")
    .eq("store_status", "active");

  let refreshed = 0;
  for (const a of artists || []) {
    try {
      await refreshAnalytics(supabase, a.artist_id);
      refreshed++;
    } catch (err) {
      log("Analytics refresh failed for artist", { artistId: a.artist_id, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { refreshed };
}

// ── BADGE EVALUATION (delegates to existing function) ──────────────────────

async function evaluateBadges(supabase: ReturnType<typeof createClient>, userId: string) {
  if (!userId) throw new Error("user_id required for badge evaluation");

  // Delegate to the evaluate-badges function for full logic
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-badges`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ user_id: userId }),
    },
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Badge evaluation failed");
  return result;
}

// ── NOTIFICATION DISPATCH ──────────────────────────────────────────────────

async function sendNotification(supabase: ReturnType<typeof createClient>, payload: Record<string, any>) {
  const { user_id, type, title, message, metadata } = payload;
  if (!user_id || !type || !title || !message) throw new Error("Missing notification fields");

  await supabase.from("notifications").insert({ user_id, type, title, message, metadata: metadata || {} });
  return { sent: true };
}
