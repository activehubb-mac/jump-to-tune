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
  const { hasActiveSubscription, isLoading } = useSubscription();

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

  return {
    canUseFeature,
    requiresSubscription,
    hasActiveSubscription,
    isLoading,
    isLoggedIn: !!user,
  };
}

