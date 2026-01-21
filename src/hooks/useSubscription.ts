import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  subscribed: boolean;
  status: "trialing" | "active" | "canceled" | "past_due" | "none";
  tier: "fan" | "artist" | "label";
  trial_ends_at?: string;
  days_left_in_trial?: number;
  current_period_end?: string;
  is_paused?: boolean;
  paused_until?: string;
}

export function useSubscription() {
  const { user, session } = useAuth();

  const { data: subscription, isLoading, error, refetch } = useQuery<SubscriptionData | null>({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!session) return null;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data as SubscriptionData;
    },
    enabled: !!user && !!session,
    staleTime: 30000, // 30 seconds - data considered fresh
    refetchInterval: 60000, // Silent background refresh every 60 seconds
    refetchOnWindowFocus: false, // Prevent refresh when switching tabs
  });

  const hasActiveSubscription = subscription?.subscribed === true;
  const isInTrial = subscription?.status === "trialing";
  const daysLeftInTrial = subscription?.days_left_in_trial ?? 0;
  const isPaused = subscription?.is_paused === true;
  const pausedUntil = subscription?.paused_until ?? null;

  // Wrap refetch to maintain backward-compatible function signature
  const refreshSubscription = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    subscription: subscription ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to check subscription") : null,
    hasActiveSubscription,
    isInTrial,
    daysLeftInTrial,
    isPaused,
    pausedUntil,
    refreshSubscription,
  };
}
