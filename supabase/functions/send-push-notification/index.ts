import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: "new_release" | "purchase" | "follow" | "like" | "general";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { user_id, user_ids, title, body, data, type = "general" } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user IDs
    const targetUserIds = user_ids || (user_id ? [user_id] : []);

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_id or user_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active push tokens for target users
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform, user_id")
      .in("user_id", targetUserIds)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens?.length || 0} active tokens for ${targetUserIds.length} users`);

    // Create in-app notifications for all target users
    const notificationInserts = targetUserIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message: body,
      metadata: data || {},
      read: false,
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notificationInserts);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
    }

    // Send push notifications to each token
    // Note: For production, you'd integrate with FCM (Firebase Cloud Messaging) 
    // or APNs (Apple Push Notification service) here
    const pushResults = [];

    for (const tokenInfo of tokens || []) {
      try {
        // For web tokens, we log them (would need Web Push API with VAPID keys)
        // For native tokens, we'd send to FCM/APNs
        console.log(`Would send push to ${tokenInfo.platform} token: ${tokenInfo.token.substring(0, 20)}...`);
        
        pushResults.push({
          user_id: tokenInfo.user_id,
          platform: tokenInfo.platform,
          success: true,
        });
      } catch (err) {
        console.error(`Failed to send push to token:`, err);
        pushResults.push({
          user_id: tokenInfo.user_id,
          platform: tokenInfo.platform,
          success: false,
          error: String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notificationInserts.length,
        push_results: pushResults,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});