import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get active superfan subscribers
    const { data: subscribers } = await supabase
      .from("superfan_subscribers")
      .select("fan_id, artist_id")
      .eq("status", "active");

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: corsHeaders });
    }

    let notified = 0;

    for (const sub of subscribers) {
      // Check last purchase activity
      const { data: recentPurchases } = await supabase
        .from("store_orders")
        .select("id")
        .eq("buyer_id", sub.fan_id)
        .eq("artist_id", sub.artist_id)
        .gte("created_at", thirtyDaysAgo)
        .limit(1);

      if (recentPurchases && recentPurchases.length > 0) continue;

      // Check if we already sent a reengagement notification in the last 30 days
      const { data: recentNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", sub.fan_id)
        .eq("type", "reengagement")
        .gte("created_at", thirtyDaysAgo)
        .limit(1);

      if (recentNotification && recentNotification.length > 0) continue;

      // Get artist name
      const { data: artist } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", sub.artist_id)
        .single();

      const artistName = artist?.display_name || "an artist you follow";

      await supabase.from("notifications").insert({
        user_id: sub.fan_id,
        type: "reengagement",
        title: `New from ${artistName}`,
        message: `Check out the latest exclusive drops from ${artistName}!`,
        metadata: { artist_id: sub.artist_id },
      });

      notified++;
    }

    return new Response(JSON.stringify({ processed: notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fan-reengagement error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
