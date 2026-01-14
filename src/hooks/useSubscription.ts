import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  subscribed: boolean;
  status: "trialing" | "active" | "canceled" | "past_due" | "none";
  tier: "fan" | "artist" | "label";
  trial_ends_at?: string;
  days_left_in_trial?: number;
  current_period_end?: string;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) {
        throw fnError;
      }

      setSubscription(data as SubscriptionData);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to check subscription");
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const hasActiveSubscription = subscription?.subscribed === true;
  const isInTrial = subscription?.status === "trialing";
  const daysLeftInTrial = subscription?.days_left_in_trial ?? 0;

  return {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    isInTrial,
    daysLeftInTrial,
    refreshSubscription: checkSubscription,
  };
}
