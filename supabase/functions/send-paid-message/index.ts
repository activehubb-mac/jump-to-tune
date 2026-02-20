import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const fanId = claimsData.claims.sub;

    const { artistId, message } = await req.json();
    if (!artistId || !message?.trim()) {
      return new Response(JSON.stringify({ error: "artistId and message required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get artist's message price
    const { data: settings } = await adminClient
      .from("artist_superfan_settings")
      .select("message_price_credits, messaging_enabled, response_window_hours")
      .eq("artist_id", artistId)
      .single();

    if (!settings?.messaging_enabled) {
      return new Response(JSON.stringify({ error: "Messaging is disabled for this artist" }), { status: 400, headers: corsHeaders });
    }

    const cost = settings.message_price_credits || 1;
    const responseWindow = settings.response_window_hours || 72;

    // Check for existing open thread
    const { data: openThread } = await adminClient
      .from("message_threads")
      .select("id")
      .eq("fan_id", fanId)
      .eq("artist_id", artistId)
      .eq("status", "open")
      .limit(1);

    if (openThread && openThread.length > 0) {
      return new Response(JSON.stringify({ error: "You already have an open message with this artist. Wait for a reply." }), { status: 400, headers: corsHeaders });
    }

    // Check fan credits
    const { data: credits } = await adminClient
      .from("message_credits")
      .select("balance")
      .eq("fan_id", fanId)
      .single();

    if (!credits || credits.balance < cost) {
      return new Response(JSON.stringify({ error: "Insufficient message credits", required: cost, balance: credits?.balance || 0 }), { status: 400, headers: corsHeaders });
    }

    // Deduct credits
    await adminClient
      .from("message_credits")
      .update({ balance: credits.balance - cost })
      .eq("fan_id", fanId);

    // Create thread
    const expiresAt = new Date(Date.now() + responseWindow * 60 * 60 * 1000).toISOString();
    const { data: thread, error: threadError } = await adminClient
      .from("message_threads")
      .insert({
        fan_id: fanId,
        artist_id: artistId,
        status: "open",
        credit_cost: cost,
        message: message.trim(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (threadError) throw threadError;

    // Notify artist
    await adminClient.from("notifications").insert({
      user_id: artistId,
      type: "paid_message",
      title: "New Paid Message",
      message: "You have a new paid message. Reply within " + responseWindow + " hours.",
      metadata: { thread_id: thread.id, fan_id: fanId },
    });

    return new Response(JSON.stringify({ success: true, thread_id: thread.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
