import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unauthenticated response");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "none", 
        tier: "fan",
        authenticated: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth error or no user - session likely expired", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "none", 
        tier: "fan",
        authenticated: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("User has no email");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "none", 
        tier: "fan",
        authenticated: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check local subscription table for trial status
    const { data: localSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (localSub) {
      logStep("Found local subscription", { 
        status: localSub.status, 
        tier: localSub.tier,
        trialEnds: localSub.trial_ends_at,
        periodEnd: localSub.current_period_end 
      });
      
      // Check for tier mismatch with user_roles (happens when onboarding skipped Stripe)
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .neq("role", "admin")
        .maybeSingle();
      
      const actualRole = roleData?.role || "fan";
      
      // If tier doesn't match role AND no Stripe subscription, sync them
      if (localSub.tier !== actualRole && !localSub.stripe_subscription_id) {
        logStep("Tier mismatch detected, syncing", { 
          currentTier: localSub.tier, 
          actualRole 
        });
        
        await supabaseClient
          .from("subscriptions")
          .update({ tier: actualRole, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        
        // Update localSub to reflect the change
        localSub.tier = actualRole;
        logStep("Tier synced to match role", { newTier: actualRole });
      }
      
      // If in trial and trial hasn't expired, return trial status
      if (localSub.status === "trialing" && new Date(localSub.trial_ends_at) > new Date()) {
        const daysLeft = Math.ceil((new Date(localSub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return new Response(JSON.stringify({
          subscribed: true,
          status: "trialing",
          tier: localSub.tier,
          trial_ends_at: localSub.trial_ends_at,
          days_left_in_trial: daysLeft,
          current_period_end: localSub.current_period_end || localSub.trial_ends_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // If has Stripe subscription, check Stripe for active status
      if (localSub.stripe_subscription_id) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        
        try {
          const subscription = await stripe.subscriptions.retrieve(localSub.stripe_subscription_id);
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          const isTrialing = subscription.status === "trialing";
          const isPaused = subscription.pause_collection !== null;
          
          // Determine resume date if paused
          let pausedUntil = null;
          if (isPaused && subscription.pause_collection?.resumes_at) {
            pausedUntil = new Date(subscription.pause_collection.resumes_at * 1000).toISOString();
          }
          
          return new Response(JSON.stringify({
            subscribed: isActive,
            status: subscription.status,
            tier: localSub.tier,
            trial_ends_at: isTrialing && subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : localSub.trial_ends_at,
            days_left_in_trial: isTrialing && subscription.trial_end 
              ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
              : 0,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            is_paused: isPaused,
            paused_until: pausedUntil,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } catch (e) {
          logStep("Stripe subscription retrieval failed, marking as canceled", { error: e });
          
          // Stripe can't find this subscription — it's been canceled/removed
          // Update local DB to prevent repeated failed lookups
          await supabaseClient
            .from("subscriptions")
            .update({ 
              status: "canceled", 
              stripe_subscription_id: null, 
              updated_at: new Date().toISOString() 
            })
            .eq("user_id", user.id);
          
          logStep("Local subscription marked as canceled after Stripe error");
          
          return new Response(JSON.stringify({
            subscribed: false,
            status: "canceled",
            tier: localSub.tier,
            trial_ends_at: localSub.trial_ends_at,
            current_period_end: localSub.current_period_end || localSub.trial_ends_at,
            days_left_in_trial: 0,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      // Fallback: validate dates before trusting local status
      const now = new Date();
      const periodEnd = localSub.current_period_end ? new Date(localSub.current_period_end) : null;
      const trialEnd = localSub.trial_ends_at ? new Date(localSub.trial_ends_at) : null;
      const periodExpired = periodEnd && periodEnd < now;
      const trialExpired = trialEnd && trialEnd < now;
      
      if (periodExpired && trialExpired) {
        // Both period and trial have passed — subscription is expired
        logStep("Subscription expired (period and trial both past)", {
          periodEnd: localSub.current_period_end,
          trialEnd: localSub.trial_ends_at,
        });
        
        // Update DB to reflect reality
        await supabaseClient
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        
        return new Response(JSON.stringify({
          subscribed: false,
          status: "canceled",
          tier: localSub.tier,
          trial_ends_at: localSub.trial_ends_at,
          current_period_end: localSub.current_period_end,
          days_left_in_trial: 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      if (periodExpired && !trialExpired) {
        // Period ended but trial is still active
        const daysLeft = Math.ceil((trialEnd!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        logStep("Period expired but trial still active", { daysLeft });
        
        return new Response(JSON.stringify({
          subscribed: true,
          status: "trialing",
          tier: localSub.tier,
          trial_ends_at: localSub.trial_ends_at,
          current_period_end: localSub.current_period_end || localSub.trial_ends_at,
          days_left_in_trial: daysLeft,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // Dates are still valid — return local data as-is (incl. store subs with no Stripe id)
      const subscribed =
        localSub.status === "active" ||
        localSub.status === "trialing" ||
        localSub.status === "past_due";
      return new Response(JSON.stringify({
        subscribed,
        status: localSub.status,
        tier: localSub.tier,
        trial_ends_at: localSub.trial_ends_at,
        current_period_end: localSub.current_period_end || localSub.trial_ends_at,
        days_left_in_trial: localSub.status === "trialing" 
          ? Math.ceil((new Date(localSub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe for any subscriptions by email
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: localSub?.status || "none",
        tier: localSub?.tier || "fan",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let productId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      logStep("Active Stripe subscription found", { subscriptionId: subscription.id });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: hasActiveSub ? "active" : (localSub?.status || "none"),
      tier: localSub?.tier || "fan",
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
