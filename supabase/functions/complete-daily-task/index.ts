import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROWTH_SCORES: Record<string, number> = {
  video: 10,
  caption: 5,
  playlist: 2,
};

const DAILY_TASKS = ["video", "caption", "playlist"];
const BONUS_CREDITS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_key } = await req.json();
    if (!DAILY_TASKS.includes(task_key)) {
      return new Response(
        JSON.stringify({ error: "Invalid task key" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Check if already completed
    const { data: existing } = await serviceClient
      .from("daily_tasks")
      .select("id, completed")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .eq("task_key", task_key)
      .maybeSingle();

    if (existing?.completed) {
      return new Response(
        JSON.stringify({ success: true, already_completed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert task as completed
    await serviceClient.from("daily_tasks").upsert(
      {
        user_id: user.id,
        task_date: today,
        task_key,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,task_date,task_key" }
    );

    // Update growth score
    const scoreInc = GROWTH_SCORES[task_key] || 0;

    // Ensure engagement row exists
    await serviceClient.from("artist_engagement").upsert(
      {
        user_id: user.id,
        streak_days: 0,
        growth_score: 0,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    // Increment growth score
    const { data: engagement } = await serviceClient
      .from("artist_engagement")
      .select("streak_days, last_active_date, growth_score")
      .eq("user_id", user.id)
      .single();

    const newScore = (engagement?.growth_score || 0) + scoreInc;

    // Update streak
    let newStreak = engagement?.streak_days || 0;
    const lastActive = engagement?.last_active_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastActive === today) {
      // Already active today, keep streak
    } else if (lastActive === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1; // Reset streak, start fresh
    }

    await serviceClient
      .from("artist_engagement")
      .update({
        growth_score: newScore,
        streak_days: newStreak,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Check if all 3 tasks completed today → award bonus
    let bonusAwarded = false;
    const { data: todayTasks } = await serviceClient
      .from("daily_tasks")
      .select("task_key, completed")
      .eq("user_id", user.id)
      .eq("task_date", today);

    const completedKeys = (todayTasks || [])
      .filter((t: { completed: boolean }) => t.completed)
      .map((t: { task_key: string }) => t.task_key);
    const allDone = DAILY_TASKS.every((k) => completedKeys.includes(k));

    if (allDone) {
      // Check if bonus already claimed today
      const { data: bonusClaim } = await serviceClient
        .from("daily_bonus_claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("claim_date", today)
        .maybeSingle();

      if (!bonusClaim) {
        // Award bonus credits
        await serviceClient.rpc("add_ai_credits", {
          p_user_id: user.id,
          p_credits: BONUS_CREDITS,
        });

        await serviceClient.from("daily_bonus_claims").insert({
          user_id: user.id,
          claim_date: today,
          credits_awarded: BONUS_CREDITS,
        });

        // Log usage
        await serviceClient.from("ai_credit_usage").insert({
          user_id: user.id,
          action: "daily_bonus",
          credits_used: -BONUS_CREDITS, // negative = reward
        });

        bonusAwarded = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_key,
        growth_score: newScore,
        streak_days: newStreak,
        bonus_awarded: bonusAwarded,
        all_completed: allDone,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
