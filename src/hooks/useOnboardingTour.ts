import { useState, useEffect, useCallback } from "react";

const TOUR_COMPLETED_KEY = "jumtunes_tour_completed";

export function useOnboardingTour(userId: string | undefined) {
  const [showTour, setShowTour] = useState(false);
  const [isNewlyVerified, setIsNewlyVerified] = useState(false);

  // Check if tour has been completed for this user
  const hasCompletedTour = useCallback(() => {
    if (!userId) return true;
    const completed = localStorage.getItem(`${TOUR_COMPLETED_KEY}_${userId}`);
    return completed === "true";
  }, [userId]);

  // Mark tour as completed
  const completeTour = useCallback(() => {
    if (userId) {
      localStorage.setItem(`${TOUR_COMPLETED_KEY}_${userId}`, "true");
    }
    setShowTour(false);
    setIsNewlyVerified(false);
  }, [userId]);

  // Trigger tour for newly verified users
  const triggerTourForNewUser = useCallback(() => {
    if (!hasCompletedTour()) {
      setIsNewlyVerified(true);
      // Small delay to let the page settle
      setTimeout(() => {
        setShowTour(true);
      }, 500);
    }
  }, [hasCompletedTour]);

  // Reset for testing
  const resetTour = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`${TOUR_COMPLETED_KEY}_${userId}`);
    }
  }, [userId]);

  return {
    showTour,
    setShowTour,
    isNewlyVerified,
    completeTour,
    triggerTourForNewUser,
    hasCompletedTour,
    resetTour,
  };
}
