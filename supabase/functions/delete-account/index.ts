import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

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
    logStep("Starting account deletion", { userId });

    // Create admin client to perform deletions
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Cancel Stripe subscription and optionally delete customer
    let stripeCleanupResult = { success: true, details: "No Stripe data to clean up" };
    
    if (stripeSecretKey) {
      logStep("Checking for Stripe subscription");
      
      // Get user's subscription data
      const { data: subscription, error: subError } = await adminClient
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (subError) {
        logStep("Error fetching subscription", { error: subError.message });
      } else if (subscription) {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-11-17.clover" });
        
        // Cancel active subscription if exists
        if (subscription.stripe_subscription_id) {
          try {
            logStep("Canceling Stripe subscription", { subscriptionId: subscription.stripe_subscription_id });
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
            logStep("Stripe subscription canceled successfully");
            stripeCleanupResult = { 
              success: true, 
              details: `Subscription ${subscription.stripe_subscription_id} canceled` 
            };
          } catch (stripeError) {
            const errorMessage = stripeError instanceof Error ? stripeError.message : "Unknown Stripe error";
            logStep("Error canceling Stripe subscription", { error: errorMessage });
            // Don't fail the entire deletion if Stripe cancellation fails
            // The subscription will be orphaned but user won't be charged (no customer)
            stripeCleanupResult = { 
              success: false, 
              details: `Failed to cancel subscription: ${errorMessage}` 
            };
          }
        }

        // Delete Stripe customer to prevent any future charges
        if (subscription.stripe_customer_id) {
          try {
            logStep("Deleting Stripe customer", { customerId: subscription.stripe_customer_id });
            await stripe.customers.del(subscription.stripe_customer_id);
            logStep("Stripe customer deleted successfully");
          } catch (stripeError) {
            const errorMessage = stripeError instanceof Error ? stripeError.message : "Unknown Stripe error";
            logStep("Error deleting Stripe customer", { error: errorMessage });
            // Customer deletion is not critical - subscription is already canceled
          }
        }
      } else {
        logStep("No subscription found for user");
      }

      // Check if user has a Stripe Connect account (for artists/labels)
      const { data: profile } = await adminClient
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.stripe_account_id) {
        logStep("User has Stripe Connect account", { accountId: profile.stripe_account_id });
        // Note: We cannot programmatically delete Stripe Connect accounts
        // The account will be orphaned but this is acceptable
        // Users can contact Stripe directly if they want to fully delete their Connect account
      }
    } else {
      logStep("STRIPE_SECRET_KEY not configured, skipping Stripe cleanup");
    }

    // Step 2: Delete user data from all tables in order (respecting foreign key constraints)
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
        logStep(`Error deleting from ${step.table}`, { error: error.message });
        deletionResults.push({ table: step.table, success: false, error: error.message });
      } else {
        logStep(`Successfully deleted from ${step.table}`);
        deletionResults.push({ table: step.table, success: true });
      }
    }

    // Finally, delete the user from auth.users
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logStep("Error deleting auth user", { error: authDeleteError.message });
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete authentication account",
          details: authDeleteError.message,
          stripeCleanup: stripeCleanupResult,
          deletionResults 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Account deletion completed successfully", { userId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully",
        stripeCleanup: stripeCleanupResult,
        deletionResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Unexpected error", { error: error instanceof Error ? error.message : "Unknown error" });
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});