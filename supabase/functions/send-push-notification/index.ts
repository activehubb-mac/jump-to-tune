import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  notify_followers_of?: string; // Artist ID to notify all followers of
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: "new_release" | "purchase" | "follow" | "like" | "general" | "track_purchase" | "track_sale";
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
    const { user_id, user_ids, notify_followers_of, title, body, data, type = "general" } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user IDs
    let targetUserIds: string[] = user_ids || (user_id ? [user_id] : []);

    // If notify_followers_of is set, fetch all followers of that artist
    if (notify_followers_of) {
      const { data: followers, error: followersError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", notify_followers_of);

      if (followersError) {
        console.error("Error fetching followers:", followersError);
      } else if (followers && followers.length > 0) {
        const followerIds = followers.map(f => f.follower_id);
        console.log(`Found ${followerIds.length} followers for artist ${notify_followers_of}`);
        targetUserIds = [...new Set([...targetUserIds, ...followerIds])];
      }
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No target users to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notifications to ${targetUserIds.length} users`);

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
    // For large follower lists, batch the inserts
    const BATCH_SIZE = 100;
    let notificationsCreated = 0;

    for (let i = 0; i < targetUserIds.length; i += BATCH_SIZE) {
      const batch = targetUserIds.slice(i, i + BATCH_SIZE);
      const notificationInserts = batch.map(userId => ({
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
        console.error("Error creating notifications batch:", notifError);
      } else {
        notificationsCreated += notificationInserts.length;
      }
    }

    console.log(`Created ${notificationsCreated} in-app notifications`);

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
        notifications_created: notificationsCreated,
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
