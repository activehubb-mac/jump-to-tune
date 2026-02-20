import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VALIDATE-TIER-CHANGE] ${step}${detailsStr}`);
};

// Tier hierarchy for upgrade/downgrade detection
const TIER_HIERARCHY = {
  fan: 1,
  artist: 2,
  label: 3,
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { newTier } = await req.json();
    if (!newTier || !["fan", "artist", "label"].includes(newTier)) {
      throw new Error("Invalid tier provided");
    }
    logStep("Request parsed", { newTier });

    // Get current role from user_roles table
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const currentTier = roleData?.role || "fan";
    logStep("Current tier", { currentTier });

    // If same tier, no validation needed
    if (currentTier === newTier) {
      return new Response(JSON.stringify({ 
        allowed: true, 
        message: "Same tier selected" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const isDowngrade = TIER_HIERARCHY[newTier as keyof typeof TIER_HIERARCHY] < 
                        TIER_HIERARCHY[currentTier as keyof typeof TIER_HIERARCHY];

    // Check if downgrading to Fan
    if (newTier === "fan" && isDowngrade) {
      // Count tracks owned by this user as artist or label
      const { count: trackCount, error: trackError } = await supabaseClient
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .or(`artist_id.eq.${user.id},label_id.eq.${user.id}`);

      if (trackError) {
        logStep("Error counting tracks", { error: trackError });
        throw new Error("Failed to check track ownership");
      }

      logStep("Track count check", { trackCount });

      if (trackCount && trackCount > 0) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: "has_tracks",
          message: `You cannot downgrade to Fan while you have ${trackCount} uploaded track${trackCount > 1 ? 's' : ''}. Please delete your tracks first or choose a different plan.`,
          trackCount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check if Label downgrading to Artist
    if (currentTier === "label" && newTier === "artist") {
      // Get roster count
      const { count: rosterCount } = await supabaseClient
        .from("label_roster")
        .select("id", { count: "exact", head: true })
        .eq("label_id", user.id)
        .eq("status", "active");

      if (rosterCount && rosterCount > 0) {
        return new Response(JSON.stringify({
          allowed: true,
          warning: "roster_release",
          message: `Note: Downgrading to Artist will release your ${rosterCount} roster artist${rosterCount > 1 ? 's' : ''} from your label. You will keep your own uploaded tracks.`,
          rosterCount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Calculate proration info for upgrades
    let prorationInfo = null;
    if (!isDowngrade) {
      // This is an upgrade - proration will be calculated by Stripe
      prorationInfo = {
        isUpgrade: true,
        message: "Your account will be charged the prorated difference for the remaining billing period.",
      };
    } else {
      prorationInfo = {
        isDowngrade: true,
        message: "Your new plan will take effect at the end of your current billing period.",
      };
    }

    logStep("Validation passed", { isDowngrade, prorationInfo });

    return new Response(JSON.stringify({
      allowed: true,
      isUpgrade: !isDowngrade,
      isDowngrade,
      currentTier,
      newTier,
      prorationInfo,
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
