import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAUSE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { action, resumeAt } = await req.json();
    logStep("Request received", { action, resumeAt });

    if (!action || !["pause", "resume"].includes(action)) {
      throw new Error("Invalid action. Must be 'pause' or 'resume'");
    }

    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("stripe_subscription_id, status, tier")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("No subscription found for user");
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription linked. You may be in a trial period.");
    }

    logStep("Found subscription", { 
      stripeId: subscription.stripe_subscription_id, 
      status: subscription.status 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    if (action === "pause") {
      // Pause the subscription - using void behavior (no charges during pause)
      const pauseParams: Stripe.SubscriptionUpdateParams = {
        pause_collection: {
          behavior: "void",
        },
      };

      // If resumeAt is provided, set the resume date
      if (resumeAt) {
        const resumeDate = new Date(resumeAt);
        if (resumeDate <= new Date()) {
          throw new Error("Resume date must be in the future");
        }
        pauseParams.pause_collection!.resumes_at = Math.floor(resumeDate.getTime() / 1000);
      }

      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        pauseParams
      );

      logStep("Subscription paused", { 
        id: updatedSubscription.id,
        pauseCollection: updatedSubscription.pause_collection 
      });

      // Create notification
      await supabaseClient
        .from("notifications")
        .insert({
          user_id: user.id,
          type: "subscription_paused",
          title: "Subscription Paused",
          message: resumeAt 
            ? `Your subscription is paused until ${new Date(resumeAt).toLocaleDateString()}`
            : "Your subscription is paused. Resume anytime from your subscription page.",
          metadata: {
            paused_at: new Date().toISOString(),
            resumes_at: resumeAt || null,
          },
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription paused successfully",
        pausedUntil: resumeAt || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "resume") {
      // Resume the subscription by unsetting pause_collection
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { pause_collection: "" as unknown as null } // Stripe SDK quirk to unset
      );

      logStep("Subscription resumed", { id: updatedSubscription.id });

      // Create notification
      await supabaseClient
        .from("notifications")
        .insert({
          user_id: user.id,
          type: "subscription_resumed",
          title: "Subscription Resumed",
          message: "Welcome back! Your subscription is now active again.",
          metadata: {
            resumed_at: new Date().toISOString(),
          },
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription resumed successfully",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
