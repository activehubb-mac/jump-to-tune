import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { Capacitor } from "@capacitor/core";
import { Haptics, NotificationType, ImpactStyle } from "@capacitor/haptics";

interface PurchaseResult {
  success: boolean;
  purchase_id: string;
  edition_number: number;
  track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    artist_name: string;
  };
  new_balance_cents: number;
}

interface InsufficientCreditsError {
  error: string;
  balance_cents: number;
  required_cents: number;
}

export function useInstantPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<PurchaseResult | null>(null);

  const purchaseTrack = useCallback(async (trackId: string): Promise<PurchaseResult | InsufficientCreditsError | null> => {
    if (!user) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to purchase tracks" });
      return null;
    }

    // Trigger haptic on purchase initiation
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {
        // Haptics not available
      }
    }

    setIsPurchasing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        showFeedback({ type: "error", title: "Session Expired", message: "Please sign in again" });
        return null;
      }

      const { data, error } = await supabase.functions.invoke("spend-credits", {
        body: { track_id: trackId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        showFeedback({ type: "error", title: "Purchase Failed", message: error.message || "Failed to purchase track" });
        return null;
      }

      // Check if it's an insufficient credits response
      if (data?.error === "Insufficient credits") {
        return data as InsufficientCreditsError;
      }

      if (data?.success) {
        const result = data as PurchaseResult;
        setLastPurchase(result);
        
        // Success haptic feedback
        if (Capacitor.isNativePlatform()) {
          try {
            await Haptics.notification({ type: NotificationType.Success });
          } catch {
            // Haptics not available
          }
        }
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["owned-tracks"] });
        queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
        
        showFeedback({ type: "success", title: "Purchase Complete", message: `Purchased "${result.track.title}" - Edition #${result.edition_number}` });
        return result;
      }

      if (data?.error) {
        showFeedback({ type: "error", title: "Purchase Failed", message: data.error });
        return null;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      showFeedback({ type: "error", title: "Error", message });
      return null;
    } finally {
      setIsPurchasing(false);
    }
  }, [user, queryClient, showFeedback]);

  const clearLastPurchase = useCallback(() => {
    setLastPurchase(null);
  }, []);

  return {
    purchaseTrack,
    isPurchasing,
    lastPurchase,
    clearLastPurchase,
  };
}

export function isInsufficientCreditsError(result: unknown): result is InsufficientCreditsError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    (result as InsufficientCreditsError).error === "Insufficient credits"
  );
}
