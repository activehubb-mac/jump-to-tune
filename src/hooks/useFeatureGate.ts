import { useCallback } from "react";
import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export type PremiumFeature = 
  | "addToQueue"
  | "shuffle"
  | "repeat"
  | "sorting"
  | "queuePanel";

export function useFeatureGate() {
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading, subscription } = useSubscription();

  const canUseFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      // If not logged in, can't use any premium features
      if (!user) return false;
      
      // If subscription is still loading, allow access (optimistic)
      if (isLoading) return true;
      
      // If user has active subscription, all features are available
      if (hasActiveSubscription) return true;
      
      // Otherwise, feature is gated
      return false;
    },
    [user, hasActiveSubscription, isLoading]
  );

  const requiresSubscription = useCallback(
    (feature: PremiumFeature): boolean => {
      return !canUseFeature(feature);
    },
    [canUseFeature]
  );

  // Check if trial/subscription has expired (not just "not active")
  const isSubscriptionExpired = useCallback((): boolean => {
    if (!user) return false;
    if (isLoading) return false;
    if (hasActiveSubscription) return false;
    
    // User is logged in, subscription loaded, but not active = expired
    // Check if they ever had a subscription (status exists and is not "trialing" with time left)
    const status = subscription?.status;
    return status === "canceled" || status === "past_due" || status === "none" || 
           (status === "trialing" && (subscription?.days_left_in_trial ?? 0) <= 0);
  }, [user, isLoading, hasActiveSubscription, subscription]);

  return {
    canUseFeature,
    requiresSubscription,
    hasActiveSubscription,
    isLoading,
    isLoggedIn: !!user,
    isSubscriptionExpired,
  };
}

