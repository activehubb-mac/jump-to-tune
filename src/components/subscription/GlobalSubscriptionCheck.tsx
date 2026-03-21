import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { SubscriptionExpiredModal } from "./SubscriptionExpiredModal";

/**
 * Global component that checks subscription status on app load
 * and shows the expiry modal when a user's trial has ended.
 * 
 * This should be placed in the Layout or App component.
 */
export function GlobalSubscriptionCheck() {
  const { user, isLoading: authLoading } = useAuth();
  const { isSubscriptionExpired, isLoading: subLoading, hasActiveSubscription } = useFeatureGate();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Check if we should show the expired modal
  useEffect(() => {
    // Wait for auth and subscription data to load
    if (authLoading || subLoading) return;
    
    // Only show for logged in users
    if (!user) return;
    
    // Don't show if user has active subscription
    if (hasActiveSubscription) return;
    
    // Check if subscription is expired
    if (isSubscriptionExpired() && !hasShownModal) {
      // Add a small delay to let the page load first
      const timer = setTimeout(() => {
        setShowExpiredModal(true);
        setHasShownModal(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, subLoading, isSubscriptionExpired, hasActiveSubscription, hasShownModal]);

  // Reset the "has shown" flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      setHasShownModal(false);
      setShowExpiredModal(false);
    }
  }, [user]);

  return (
    <SubscriptionExpiredModal
      open={showExpiredModal}
      onOpenChange={setShowExpiredModal}
    />
  );
}
