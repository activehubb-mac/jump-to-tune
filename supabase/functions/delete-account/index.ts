import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Create admin client to perform deletions
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete user data from all tables in order (respecting foreign key constraints)
    // Note: Some tables have ON DELETE CASCADE, but we'll be explicit for safety
    
    const deletionSteps = [
      // 1. Delete notifications
      { table: "notifications", column: "user_id" },
      // 2. Delete collection bookmarks
      { table: "collection_bookmarks", column: "user_id" },
      // 3. Delete likes
      { table: "likes", column: "user_id" },
      // 4. Delete follows (both as follower and following)
      { table: "follows", column: "follower_id" },
      { table: "follows", column: "following_id" },
      // 5. Delete purchases
      { table: "purchases", column: "user_id" },
      // 6. Delete credit transactions
      { table: "credit_transactions", column: "user_id" },
      // 7. Delete credit wallet
      { table: "credit_wallets", column: "user_id" },
      // 8. Delete artist earnings
      { table: "artist_earnings", column: "artist_id" },
      // 9. Delete label roster entries (as artist or label)
      { table: "label_roster", column: "artist_id" },
      { table: "label_roster", column: "label_id" },
      // 10. Delete track karaoke data for user's tracks
      // (handled via tracks deletion cascade)
      // 11. Delete tracks (as artist or label)
      { table: "tracks", column: "artist_id" },
      { table: "tracks", column: "label_id" },
      // 12. Delete profile genres
      { table: "profile_genres", column: "profile_id" },
      // 13. Delete subscription
      { table: "subscriptions", column: "user_id" },
      // 14. Delete user roles
      { table: "user_roles", column: "user_id" },
      // 15. Delete profile (last before auth.users)
      { table: "profiles", column: "id" },
    ];

    const deletionResults: { table: string; success: boolean; error?: string }[] = [];

    for (const step of deletionSteps) {
      const { error } = await adminClient
        .from(step.table)
        .delete()
        .eq(step.column, userId);

      if (error) {
        console.error(`Error deleting from ${step.table}: ${error.message}`);
        deletionResults.push({ table: step.table, success: false, error: error.message });
      } else {
        console.log(`Successfully deleted from ${step.table}`);
        deletionResults.push({ table: step.table, success: true });
      }
    }

    // Finally, delete the user from auth.users
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`Error deleting auth user: ${authDeleteError.message}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete authentication account",
          details: authDeleteError.message,
          deletionResults 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted auth user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully",
        deletionResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
