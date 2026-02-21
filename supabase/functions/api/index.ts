import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── HELPERS ────────────────────────────────────────────────────────────────

const log = (step: string, details?: any) =>
  console.log(`[API] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

type ApiResponse = { success: boolean; data: any; error: string | null };

const json = (body: ApiResponse, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ok = (data: any) => json({ success: true, data, error: null });
const fail = (error: string, status = 400) =>
  json({ success: false, data: null, error }, status);

function parsePath(url: string): { segments: string[]; query: URLSearchParams } {
  const u = new URL(url);
  // Path after /api/ — e.g. /api/artists/123/follow → ["artists","123","follow"]
  const raw = u.pathname.replace(/^\/api\//, "").replace(/^\/+|\/+$/g, "");
  const segments = raw ? raw.split("/") : [];
  return { segments, query: u.searchParams };
}

// ── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────

type AuthContext = {
  userId: string;
  email: string;
  role: "fan" | "artist" | "label" | "admin";
  isAdmin: boolean;
};

async function authenticate(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return fail("Authentication required", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return fail("Invalid or expired token", 401);

  // Fetch primary role (exclude admin — that's a privilege, not identity)
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .neq("role", "admin")
    .maybeSingle();

  // Check admin privilege separately
  const { data: adminRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email || "",
    role: (roleRow?.role as any) || "fan",
    isAdmin: !!adminRow,
  };
}

function requireRole(auth: AuthContext, allowed: string[]): Response | null {
  if (auth.isAdmin) return null; // Admins can do anything
  if (!allowed.includes(auth.role)) {
    return fail("Insufficient permissions", 403);
  }
  return null;
}

// ── ROUTE HANDLERS ─────────────────────────────────────────────────────────

async function handleAuthMe(
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.userId)
    .single();

  return ok({
    id: auth.userId,
    email: auth.email,
    role: auth.role,
    is_admin: auth.isAdmin,
    profile,
  });
}

// ── FOLLOW SYSTEM ──────────────────────────────────────────────────────────

async function handleFollow(
  method: string,
  artistId: string,
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
) {
  if (auth.userId === artistId) return fail("Cannot follow yourself");

  if (method === "POST") {
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: auth.userId, following_id: artistId },
        { onConflict: "follower_id,following_id" },
      );
    if (error) return fail(error.message, 500);
    return ok({ followed: true });
  }

  if (method === "DELETE") {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", auth.userId)
      .eq("following_id", artistId);
    if (error) return fail(error.message, 500);
    return ok({ followed: false });
  }

  return fail("Method not allowed", 405);
}

async function handleFollowers(
  artistId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", artistId);

  if (error) return fail(error.message, 500);
  return ok({ artist_id: artistId, follower_count: count || 0 });
}

// ── DROP SYSTEM ────────────────────────────────────────────────────────────

async function handleArtistDrops(
  method: string,
  segments: string[],
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  const roleCheck = requireRole(auth, ["artist", "label"]);
  if (roleCheck) return roleCheck;

  // GET /artist/drops
  if (method === "GET" && segments.length === 2) {
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("artist_id", auth.userId)
      .order("created_at", { ascending: false });
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // POST /artist/drops — create draft
  if (method === "POST" && segments.length === 2) {
    if (!body?.title || !body?.type || body?.price_cents == null) {
      return fail("title, type, and price_cents are required");
    }
    const { data, error } = await supabase
      .from("store_products")
      .insert({
        artist_id: auth.userId,
        title: body.title.slice(0, 200),
        type: body.type,
        price_cents: Math.max(0, Math.round(body.price_cents)),
        description: body.description?.slice(0, 2000) || null,
        image_url: body.image_url || null,
        audio_url: body.audio_url || null,
        inventory_limit: body.inventory_limit || null,
        is_active: false, // Always starts as draft
        status: "draft",
      })
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // PUT /artist/drops/{id} — update draft
  if (method === "PUT" && segments.length === 3) {
    const dropId = segments[2];
    // Verify ownership
    const { data: existing } = await supabase
      .from("store_products")
      .select("artist_id, status")
      .eq("id", dropId)
      .single();
    if (!existing) return fail("Drop not found", 404);
    if (existing.artist_id !== auth.userId) return fail("Not your drop", 403);

    const updates: Record<string, any> = {};
    if (body?.title) updates.title = body.title.slice(0, 200);
    if (body?.description !== undefined) updates.description = body.description?.slice(0, 2000) || null;
    if (body?.price_cents != null) updates.price_cents = Math.max(0, Math.round(body.price_cents));
    if (body?.image_url !== undefined) updates.image_url = body.image_url;
    if (body?.inventory_limit !== undefined) updates.inventory_limit = body.inventory_limit;

    const { data, error } = await supabase
      .from("store_products")
      .update(updates)
      .eq("id", dropId)
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // POST /artist/drops/{id}/activate
  if (method === "POST" && segments.length === 4 && segments[3] === "activate") {
    const dropId = segments[2];
    const { data: drop } = await supabase
      .from("store_products")
      .select("artist_id, status, is_active")
      .eq("id", dropId)
      .single();
    if (!drop) return fail("Drop not found", 404);
    if (drop.artist_id !== auth.userId) return fail("Not your drop", 403);

    // Verify Stripe is connected
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("id", auth.userId)
      .single();
    if (!profile?.stripe_account_id || !profile.stripe_payouts_enabled) {
      return fail("Stripe Connect account required to activate drops. Set up payouts first.", 403);
    }

    // Also verify artist_store exists and is active
    const { data: store } = await supabase
      .from("artist_stores")
      .select("store_status")
      .eq("artist_id", auth.userId)
      .single();
    if (!store || store.store_status !== "active") {
      return fail("Your store must be active to activate drops.", 403);
    }

    const { data: activated, error } = await supabase
      .from("store_products")
      .update({ is_active: true, status: "active" })
      .eq("id", dropId)
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(activated);
  }

  return fail("Not found", 404);
}

async function handlePublicDrops(
  method: string,
  segments: string[],
  auth: AuthContext | null,
  supabase: ReturnType<typeof createClient>,
) {
  // GET /drops
  if (method === "GET" && segments.length === 1) {
    const { data, error } = await supabase
      .from("store_products")
      .select("*, artist:profiles!store_products_artist_id_fkey(display_name, avatar_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // GET /drops/{id}
  if (method === "GET" && segments.length === 2) {
    const { data, error } = await supabase
      .from("store_products")
      .select("*, artist:profiles!store_products_artist_id_fkey(display_name, avatar_url)")
      .eq("id", segments[1])
      .eq("is_active", true)
      .single();
    if (error) return fail("Drop not found", 404);
    return ok(data);
  }

  // POST /drops/{id}/checkout-session — requires auth
  if (method === "POST" && segments.length === 3 && segments[2] === "checkout-session") {
    if (!auth) return fail("Authentication required", 401);

    const dropId = segments[1];
    // Validate drop exists, is active, not before scheduled release
    const { data: product } = await supabase
      .from("store_products")
      .select("*")
      .eq("id", dropId)
      .single();
    if (!product) return fail("Drop not found", 404);
    if (!product.is_active) return fail("Drop is not active", 400);
    if (product.scheduled_release_at && new Date(product.scheduled_release_at) > new Date()) {
      return fail("Drop has not been released yet", 400);
    }
    if (product.inventory_limit && product.inventory_sold >= product.inventory_limit) {
      return fail("Drop is sold out", 400);
    }

    // Delegate to create-store-checkout (internal call)
    const checkoutResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-store-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "x-forwarded-authorization": `Bearer ${auth.userId}`, // pass user context
        },
        body: JSON.stringify({ productId: dropId, quantity: 1 }),
      },
    );
    // Actually we need the user's token, not service role for checkout
    // The checkout function authenticates the user itself
    // So we pass through the original auth header
    return fail("Use the create-store-checkout function directly for checkout sessions", 400);
  }

  return fail("Not found", 404);
}

// ── WAITLIST ───────────────────────────────────────────────────────────────

async function handleWaitlist(
  method: string,
  dropId: string,
  auth: AuthContext | null,
  supabase: ReturnType<typeof createClient>,
) {
  // GET /drops/{id}/waitlist-count — public
  if (method === "GET") {
    const { count, error } = await supabase
      .from("drop_waitlists")
      .select("*", { count: "exact", head: true })
      .eq("product_id", dropId);
    if (error) return fail(error.message, 500);
    return ok({ product_id: dropId, waitlist_count: count || 0 });
  }

  if (!auth) return fail("Authentication required", 401);

  if (method === "POST") {
    // Prevent duplicate via upsert
    const { error } = await supabase
      .from("drop_waitlists")
      .upsert(
        { product_id: dropId, user_id: auth.userId },
        { onConflict: "product_id,user_id" },
      );
    if (error) return fail(error.message, 500);
    return ok({ joined: true });
  }

  if (method === "DELETE") {
    const { error } = await supabase
      .from("drop_waitlists")
      .delete()
      .eq("product_id", dropId)
      .eq("user_id", auth.userId);
    if (error) return fail(error.message, 500);
    return ok({ joined: false });
  }

  return fail("Method not allowed", 405);
}

// ── ANNOUNCEMENTS ──────────────────────────────────────────────────────────

async function handleArtistAnnouncements(
  method: string,
  segments: string[],
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  const roleCheck = requireRole(auth, ["artist"]);
  if (roleCheck) return roleCheck;

  if (method === "GET") {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("artist_id", auth.userId)
      .order("created_at", { ascending: false });
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  if (method === "POST" && segments.length === 2) {
    if (!body?.title || !body?.body) return fail("title and body are required");
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        artist_id: auth.userId,
        title: body.title.slice(0, 200),
        body: body.body.slice(0, 5000),
        image_url: body.image_url || null,
        cta_label: body.cta_label?.slice(0, 100) || null,
        cta_url: body.cta_url?.slice(0, 500) || null,
        is_highlighted: body.is_highlighted || false,
      })
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // DELETE /artist/announcements/{id}
  if (method === "DELETE" && segments.length === 3) {
    const { data: existing } = await supabase
      .from("announcements")
      .select("artist_id")
      .eq("id", segments[2])
      .single();
    if (!existing) return fail("Announcement not found", 404);
    if (existing.artist_id !== auth.userId) return fail("Not your announcement", 403);

    const { error } = await supabase.from("announcements").delete().eq("id", segments[2]);
    if (error) return fail(error.message, 500);
    return ok({ deleted: true });
  }

  return fail("Not found", 404);
}

async function handleAnnouncementReact(
  method: string,
  announcementId: string,
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  if (method !== "POST") return fail("Method not allowed", 405);
  if (!body?.emoji) return fail("emoji is required");

  // Enforce one reaction per user per announcement (upsert)
  const { error } = await supabase
    .from("announcement_reactions")
    .upsert(
      {
        announcement_id: announcementId,
        user_id: auth.userId,
        emoji: body.emoji.slice(0, 10),
      },
      { onConflict: "announcement_id,user_id" },
    );
  if (error) return fail(error.message, 500);
  return ok({ reacted: true });
}

// ── BADGES ─────────────────────────────────────────────────────────────────

async function handleBadges(
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  // Read-only — no POST endpoint
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true);
  if (error) return fail(error.message, 500);
  return ok(data);
}

// ── MESSAGES ───────────────────────────────────────────────────────────────

async function handleMessages(
  method: string,
  segments: string[],
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  // GET /messages/inbox
  if (method === "GET" && segments[1] === "inbox") {
    // Fan sees threads they sent; artist sees threads received
    const fanThreads = await supabase
      .from("message_threads")
      .select("*")
      .eq("fan_id", auth.userId)
      .order("created_at", { ascending: false });

    const artistThreads = await supabase
      .from("message_threads")
      .select("*")
      .eq("artist_id", auth.userId)
      .order("created_at", { ascending: false });

    return ok({
      sent: fanThreads.data || [],
      received: artistThreads.data || [],
    });
  }

  // POST /messages/send
  if (method === "POST" && segments[1] === "send") {
    if (!body?.artist_id || !body?.message) {
      return fail("artist_id and message are required");
    }

    const artistId = body.artist_id;
    const message = body.message.slice(0, 2000);

    // Verify messaging is enabled for this artist
    const { data: settings } = await supabase
      .from("artist_superfan_settings")
      .select("messaging_enabled, message_price_credits")
      .eq("artist_id", artistId)
      .single();

    if (!settings?.messaging_enabled) {
      return fail("This artist does not accept messages", 400);
    }

    const creditCost = settings.message_price_credits || 1;

    // Check credits balance
    const { data: credits } = await supabase
      .from("message_credits")
      .select("balance")
      .eq("fan_id", auth.userId)
      .single();

    if (!credits || credits.balance < creditCost) {
      return fail(`Insufficient message credits. Need ${creditCost}, have ${credits?.balance || 0}`, 400);
    }

    // Check for existing open thread (one active thread rule)
    const { data: existingThread } = await supabase
      .from("message_threads")
      .select("id")
      .eq("fan_id", auth.userId)
      .eq("artist_id", artistId)
      .eq("status", "open")
      .maybeSingle();

    if (existingThread) {
      return fail("You already have an active message thread with this artist", 400);
    }

    // Deduct credits
    const { error: creditError } = await supabase
      .from("message_credits")
      .update({
        balance: credits.balance - creditCost,
        updated_at: new Date().toISOString(),
      })
      .eq("fan_id", auth.userId);

    if (creditError) return fail("Failed to deduct credits", 500);

    // Create thread
    const { data: thread, error } = await supabase
      .from("message_threads")
      .insert({
        fan_id: auth.userId,
        artist_id: artistId,
        message,
        credit_cost: creditCost,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      // Refund credits on failure
      await supabase
        .from("message_credits")
        .update({ balance: credits.balance })
        .eq("fan_id", auth.userId);
      return fail(error.message, 500);
    }

    return ok(thread);
  }

  return fail("Not found", 404);
}

// ── ANALYTICS ──────────────────────────────────────────────────────────────

async function handleArtistAnalytics(
  segments: string[],
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
) {
  const roleCheck = requireRole(auth, ["artist", "label"]);
  if (roleCheck) return roleCheck;

  const sub = segments[2]; // overview | drops | supporters

  if (sub === "overview") {
    const [followers, earnings, orders] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", auth.userId),
      supabase
        .from("artist_earnings")
        .select("gross_amount_cents, artist_payout_cents")
        .eq("artist_id", auth.userId),
      supabase
        .from("store_orders")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", auth.userId)
        .in("status", ["completed", "paid"]),
    ]);

    const totalEarnings = (earnings.data || []).reduce(
      (sum, e) => sum + e.artist_payout_cents,
      0,
    );

    return ok({
      follower_count: followers.count || 0,
      total_earnings_cents: totalEarnings,
      total_orders: orders.count || 0,
    });
  }

  if (sub === "drops") {
    const { data } = await supabase
      .from("store_products")
      .select("id, title, price_cents, inventory_sold, inventory_limit, status, created_at")
      .eq("artist_id", auth.userId)
      .order("created_at", { ascending: false });
    return ok(data || []);
  }

  if (sub === "supporters") {
    // Fan loyalty data — no sensitive payment info
    const { data } = await supabase
      .from("fan_loyalty")
      .select("fan_id, points, level, created_at, fan:profiles!fan_loyalty_fan_id_fkey(display_name, avatar_url)")
      .eq("artist_id", auth.userId)
      .order("points", { ascending: false })
      .limit(100);
    return ok(data || []);
  }

  return fail("Invalid analytics endpoint", 404);
}

// ── TRENDING ───────────────────────────────────────────────────────────────

async function handleTrending(supabase: ReturnType<typeof createClient>) {
  // Server-calculated demand ratio — never expose scoring formula
  const { data: products } = await supabase
    .from("store_products")
    .select("id, title, price_cents, inventory_sold, inventory_limit, status, image_url, artist_id, created_at, is_featured")
    .eq("is_active", true)
    .order("inventory_sold", { ascending: false })
    .limit(50);

  if (!products) return ok([]);

  // Admin-pinned items first, then by demand ratio
  const scored = products.map((p) => {
    const limit = p.inventory_limit || 1000;
    const demandRatio = p.inventory_sold / limit;
    const recencyBonus = Math.max(0, 1 - (Date.now() - new Date(p.created_at).getTime()) / (30 * 86400000));
    // Score is internal — never returned
    const _score = demandRatio * 0.7 + recencyBonus * 0.3 + (p.is_featured ? 10 : 0);
    return { ...p, _score };
  });

  scored.sort((a, b) => b._score - a._score);

  // Strip internal score before returning
  const trending = scored.map(({ _score, ...rest }) => rest);
  return ok(trending);
}

// ── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

async function handleAdmin(
  method: string,
  segments: string[],
  auth: AuthContext,
  supabase: ReturnType<typeof createClient>,
  body: any,
) {
  if (!auth.isAdmin) return fail("Admin access required", 403);

  const sub = segments[1]; // featured | analytics | moderate

  // POST /admin/featured — pin/feature a drop
  if (sub === "featured" && method === "POST") {
    if (!body?.content_id || !body?.content_type) {
      return fail("content_id and content_type are required");
    }
    const { data, error } = await supabase
      .from("featured_content")
      .insert({
        content_id: body.content_id,
        content_type: body.content_type,
        display_location: body.display_location || "home",
        priority: body.priority || 1,
        created_by: auth.userId,
      })
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // GET /admin/analytics
  if (sub === "analytics" && method === "GET") {
    const [users, tracks, orders, revenue] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("store_products").select("*", { count: "exact", head: true }),
      supabase
        .from("store_orders")
        .select("amount_cents, platform_fee_cents")
        .in("status", ["completed", "paid"]),
      supabase.from("artist_earnings").select("gross_amount_cents, platform_fee_cents"),
    ]);

    const totalRevenue = (revenue.data || []).reduce(
      (sum, e) => sum + e.gross_amount_cents,
      0,
    );
    const totalPlatformFee = (revenue.data || []).reduce(
      (sum, e) => sum + e.platform_fee_cents,
      0,
    );

    return ok({
      total_users: users.count || 0,
      total_products: tracks.count || 0,
      total_orders: (orders.data || []).length,
      total_revenue_cents: totalRevenue,
      platform_fees_cents: totalPlatformFee,
    });
  }

  // POST /admin/moderate — update report status
  if (sub === "moderate" && method === "POST") {
    if (!body?.report_id || !body?.status) {
      return fail("report_id and status are required");
    }
    const { data, error } = await supabase
      .from("reports")
      .update({
        status: body.status,
        admin_notes: body.admin_notes?.slice(0, 2000) || null,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.report_id)
      .select()
      .single();
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  return fail("Admin endpoint not found", 404);
}

// ── MAIN ROUTER ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { segments, query } = parsePath(req.url);
  const method = req.method;
  let body: any = null;

  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  log("Request", { method, path: segments.join("/"), hasBody: !!body });

  // ── Public routes (no auth required) ──────────────────────────────────

  // GET /auth/me — requires auth
  if (segments[0] === "auth" && segments[1] === "me" && method === "GET") {
    const auth = await authenticate(req, supabase);
    if (auth instanceof Response) return auth;
    return handleAuthMe(auth, supabase);
  }

  // GET /trending
  if (segments[0] === "trending" && method === "GET") {
    return handleTrending(supabase);
  }

  // GET /drops, GET /drops/{id}
  if (segments[0] === "drops") {
    // Waitlist endpoints
    if (segments.length >= 3 && segments[2] === "waitlist") {
      if (method === "GET") {
        return handleWaitlist("GET", segments[1], null, supabase);
      }
      // POST/DELETE waitlist requires auth
      const auth = await authenticate(req, supabase);
      if (auth instanceof Response) return auth;
      return handleWaitlist(method, segments[1], auth, supabase);
    }

    // GET /drops/{id}/waitlist-count
    if (segments.length === 3 && segments[2] === "waitlist-count" && method === "GET") {
      return handleWaitlist("GET", segments[1], null, supabase);
    }

    // Checkout requires auth
    if (segments.length === 3 && segments[2] === "checkout-session") {
      const auth = await authenticate(req, supabase);
      if (auth instanceof Response) return auth;
      return handlePublicDrops(method, segments, auth, supabase);
    }

    // Public drop listing
    if (method === "GET") {
      return handlePublicDrops(method, segments, null, supabase);
    }
  }

  // GET /users/{id}/badges — public
  if (segments[0] === "users" && segments.length === 3 && segments[2] === "badges" && method === "GET") {
    return handleBadges(segments[1], supabase);
  }

  // GET /artists/{id}/followers — public
  if (segments[0] === "artists" && segments.length === 3 && segments[2] === "followers" && method === "GET") {
    return handleFollowers(segments[1], supabase);
  }

  // GET /artist/{id}/announcements — public
  if (segments[0] === "artist" && segments.length === 3 && segments[2] === "announcements" && method === "GET") {
    const { data, error } = await supabase
      .from("announcements")
      .select("*, reactions:announcement_reactions(emoji, user_id)")
      .eq("artist_id", segments[1])
      .order("created_at", { ascending: false });
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  // ── Authenticated routes ──────────────────────────────────────────────

  const auth = await authenticate(req, supabase);
  if (auth instanceof Response) return auth;

  // POST/DELETE /artists/{id}/follow
  if (segments[0] === "artists" && segments.length === 3 && segments[2] === "follow") {
    return handleFollow(method, segments[1], auth, supabase);
  }

  // /artist/drops/*
  if (segments[0] === "artist" && segments[1] === "drops") {
    return handleArtistDrops(method, segments, auth, supabase, body);
  }

  // /artist/announcements/*
  if (segments[0] === "artist" && segments[1] === "announcements") {
    return handleArtistAnnouncements(method, segments, auth, supabase, body);
  }

  // POST /announcements/{id}/react
  if (segments[0] === "announcements" && segments.length === 3 && segments[2] === "react") {
    return handleAnnouncementReact(method, segments[1], auth, supabase, body);
  }

  // /messages/*
  if (segments[0] === "messages") {
    return handleMessages(method, segments, auth, supabase, body);
  }

  // /artist/analytics/*
  if (segments[0] === "artist" && segments[1] === "analytics") {
    return handleArtistAnalytics(segments, auth, supabase);
  }

  // /admin/*
  if (segments[0] === "admin") {
    return handleAdmin(method, segments, auth, supabase, body);
  }

  return fail("Endpoint not found", 404);
});
