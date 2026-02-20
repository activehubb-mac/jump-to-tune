import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate
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
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const artistId = claims.claims.sub as string;

    // Use service role for data queries
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Gather fan data
    const [purchasesRes, ordersRes, subscribersRes, loyaltyRes] = await Promise.all([
      adminClient.from("purchases").select("user_id, price_paid, tip_amount, purchased_at, track_id").in(
        "track_id",
        (await adminClient.from("tracks").select("id").eq("artist_id", artistId)).data?.map((t: any) => t.id) || []
      ),
      adminClient.from("store_orders").select("buyer_id, amount_cents, created_at, status").eq("artist_id", artistId),
      adminClient.from("superfan_subscribers").select("fan_id, status, subscribed_at, lifetime_spent_cents, tier_level").eq("artist_id", artistId),
      adminClient.from("fan_loyalty").select("fan_id, points, level").eq("artist_id", artistId),
    ]);

    // Aggregate per fan
    const fanMap: Record<string, any> = {};

    const addFan = (fanId: string) => {
      if (!fanMap[fanId]) {
        fanMap[fanId] = { fan_id: fanId, total_spent: 0, purchase_count: 0, last_purchase: null, subscription_status: null, loyalty_level: "listener", loyalty_points: 0 };
      }
      return fanMap[fanId];
    };

    for (const p of purchasesRes.data || []) {
      const f = addFan(p.user_id);
      f.total_spent += Number(p.price_paid || 0) + Number(p.tip_amount || 0);
      f.purchase_count++;
      if (!f.last_purchase || p.purchased_at > f.last_purchase) f.last_purchase = p.purchased_at;
    }

    for (const o of ordersRes.data || []) {
      const f = addFan(o.buyer_id);
      f.total_spent += (o.amount_cents || 0) / 100;
      f.purchase_count++;
      if (!f.last_purchase || o.created_at > f.last_purchase) f.last_purchase = o.created_at;
    }

    for (const s of subscribersRes.data || []) {
      const f = addFan(s.fan_id);
      f.subscription_status = s.status;
      f.total_spent += (s.lifetime_spent_cents || 0) / 100;
    }

    for (const l of loyaltyRes.data || []) {
      const f = addFan(l.fan_id);
      f.loyalty_level = l.level;
      f.loyalty_points = l.points;
    }

    const fans = Object.values(fanMap);

    // Get profile info for fans
    const fanIds = fans.map((f: any) => f.fan_id);
    const { data: profiles } = fanIds.length > 0
      ? await adminClient.from("profiles").select("id, display_name, avatar_url").in("id", fanIds)
      : { data: [] };

    const profileMap: Record<string, any> = {};
    for (const p of profiles || []) profileMap[p.id] = p;

    const enriched = fans.map((f: any) => ({
      ...f,
      display_name: profileMap[f.fan_id]?.display_name || null,
      avatar_url: profileMap[f.fan_id]?.avatar_url || null,
    }));

    // Use AI to classify fans
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY || enriched.length === 0) {
      // Fallback: manual classification without AI
      const sorted = [...enriched].sort((a, b) => b.total_spent - a.total_spent);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const LEVEL_THRESHOLDS: Record<string, number> = { listener: 0, supporter: 50, insider: 150, elite: 500, founding_superfan: 1000 };
      const NEXT_LEVEL: Record<string, string> = { listener: "supporter", supporter: "insider", insider: "elite", elite: "founding_superfan" };

      return new Response(JSON.stringify({
        top_supporters: sorted.slice(0, 10),
        rising_supporters: sorted.filter((f) => f.purchase_count >= 2).slice(0, 5),
        at_risk_subscribers: enriched.filter((f) => f.subscription_status === "active" && f.last_purchase && f.last_purchase < thirtyDaysAgo),
        fans_near_next_level: enriched.filter((f) => {
          const next = NEXT_LEVEL[f.loyalty_level];
          if (!next) return false;
          const threshold = LEVEL_THRESHOLDS[next];
          return f.loyalty_points >= threshold * 0.8;
        }),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // AI-enhanced classification
    const fanSummary = enriched.map((f: any) => `${f.display_name || "Anonymous"}: $${f.total_spent.toFixed(2)} spent, ${f.purchase_count} purchases, level=${f.loyalty_level}, points=${f.loyalty_points}, sub=${f.subscription_status || "none"}, last=${f.last_purchase || "never"}`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a fan analytics engine. Classify fans into segments. Return structured data via the tool call." },
          { role: "user", content: `Classify these fans for an artist:\n${fanSummary}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_fans",
            description: "Classify fans into segments",
            parameters: {
              type: "object",
              properties: {
                top_supporter_ids: { type: "array", items: { type: "string" }, description: "Top 10 fan IDs by engagement" },
                rising_supporter_ids: { type: "array", items: { type: "string" }, description: "Fans with increasing activity" },
                at_risk_ids: { type: "array", items: { type: "string" }, description: "Subscribers inactive 30+ days" },
                near_next_level_ids: { type: "array", items: { type: "string" }, description: "Fans close to leveling up" },
              },
              required: ["top_supporter_ids", "rising_supporter_ids", "at_risk_ids", "near_next_level_ids"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_fans" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), { status: 429, headers: corsHeaders });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: corsHeaders });
      }
      // Fallback to manual
      const sorted = [...enriched].sort((a, b) => b.total_spent - a.total_spent);
      return new Response(JSON.stringify({
        top_supporters: sorted.slice(0, 10),
        rising_supporters: [],
        at_risk_subscribers: [],
        fans_near_next_level: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      const fanById = Object.fromEntries(enriched.map((f: any) => [f.fan_id, f]));
      const lookup = (ids: string[]) => ids.map((id: string) => fanById[id]).filter(Boolean);

      return new Response(JSON.stringify({
        top_supporters: lookup(args.top_supporter_ids || []),
        rising_supporters: lookup(args.rising_supporter_ids || []),
        at_risk_subscribers: lookup(args.at_risk_ids || []),
        fans_near_next_level: lookup(args.near_next_level_ids || []),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fallback
    const sorted = [...enriched].sort((a, b) => b.total_spent - a.total_spent);
    return new Response(JSON.stringify({
      top_supporters: sorted.slice(0, 10),
      rising_supporters: [],
      at_risk_subscribers: [],
      fans_near_next_level: [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("fan-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
