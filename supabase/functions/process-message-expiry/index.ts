import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find expired open threads
    const { data: expiredThreads, error } = await adminClient
      .from("message_threads")
      .select("*")
      .eq("status", "open")
      .lt("expires_at", new Date().toISOString());

    if (error) throw error;

    let refunded = 0;
    for (const thread of expiredThreads || []) {
      // Refund credits
      const { data: credits } = await adminClient
        .from("message_credits")
        .select("balance")
        .eq("fan_id", thread.fan_id)
        .single();

      if (credits) {
        await adminClient
          .from("message_credits")
          .update({ balance: credits.balance + thread.credit_cost })
          .eq("fan_id", thread.fan_id);
      } else {
        await adminClient
          .from("message_credits")
          .insert({ fan_id: thread.fan_id, balance: thread.credit_cost });
      }

      // Mark thread expired + refunded
      await adminClient
        .from("message_threads")
        .update({ status: "expired", refunded: true })
        .eq("id", thread.id);

      // Notify fan
      await adminClient.from("notifications").insert({
        user_id: thread.fan_id,
        type: "message_refund",
        title: "Message Credit Refunded",
        message: `Your ${thread.credit_cost} credit(s) have been refunded because the artist didn't respond in time.`,
        metadata: { thread_id: thread.id },
      });

      refunded++;
    }

    return new Response(JSON.stringify({ processed: refunded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
