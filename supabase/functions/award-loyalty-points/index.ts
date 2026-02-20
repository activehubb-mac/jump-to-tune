import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const { fan_id, artist_id, event_type } = await req.json();
    if (!fan_id || !artist_id || !event_type) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: corsHeaders });
    }

    // Determine points to award
    const pointsMap: Record<string, number> = {
      purchase_digital: 10,
      purchase_merch: 15,
      subscribe_superfan: 50,
      purchase_limited: 25,
      purchase_early: 20,
    };
    const pointsToAdd = pointsMap[event_type] || 10;

    // Upsert fan_loyalty row
    const { data: existing } = await supabase
      .from("fan_loyalty")
      .select("id, points, level")
      .eq("fan_id", fan_id)
      .eq("artist_id", artist_id)
      .maybeSingle();

    const previousPoints = existing?.points ?? 0;
    const previousLevel = existing?.level ?? "listener";
    const newPoints = previousPoints + pointsToAdd;
    const newLevel = getLevelFromPoints(newPoints);

    if (existing) {
      await supabase
        .from("fan_loyalty")
        .update({ points: newPoints, level: newLevel })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("fan_loyalty")
        .insert({ fan_id, artist_id, points: newPoints, level: newLevel });
    }

    // Check for level-up
    if (newLevel !== previousLevel) {
      // Get artist name for notification
      const { data: artistProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", artist_id)
        .single();

      const artistName = artistProfile?.display_name || "an artist";
      const levelName = newLevel.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

      await supabase.from("notifications").insert({
        user_id: fan_id,
        type: "level_up",
        title: `Level Up! You're now ${levelName}`,
        message: `Your support for ${artistName} has earned you the ${levelName} badge!`,
        metadata: { artist_id, new_level: newLevel, points: newPoints },
      });
    }

    return new Response(JSON.stringify({ success: true, points: newPoints, level: newLevel, leveled_up: newLevel !== previousLevel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("award-loyalty-points error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
