import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePurchases } from "@/hooks/usePurchases";

export function useTrackAccess() {
  const { user } = useAuth();
  const { isOwned: isPurchased, purchasedTrackIds } = usePurchases();
  const accessCache = useRef<Map<string, boolean>>(new Map());

  const checkFullAccess = useCallback(async (trackId: string): Promise<boolean> => {
    if (!user) return false;

    // Check cache first
    if (accessCache.current.has(trackId)) {
      return accessCache.current.get(trackId)!;
    }

    // Check if user purchased the track
    if (isPurchased(trackId)) {
      accessCache.current.set(trackId, true);
      return true;
    }

    // Check if user is the artist or label owner
    try {
      const { data: track, error } = await supabase
        .from("tracks")
        .select("artist_id, label_id")
        .eq("id", trackId)
        .single();

      if (error) {
        console.error("Error checking track access:", error);
        accessCache.current.set(trackId, false);
        return false;
      }

      const hasAccess = track?.artist_id === user.id || track?.label_id === user.id;
      accessCache.current.set(trackId, hasAccess);
      return hasAccess;
    } catch (e) {
      console.error("Error checking track access:", e);
      accessCache.current.set(trackId, false);
      return false;
    }
  }, [user, isPurchased]);

  // Invalidate cache when purchases change
  const invalidateCache = useCallback((trackId?: string) => {
    if (trackId) {
      accessCache.current.delete(trackId);
    } else {
      accessCache.current.clear();
    }
  }, []);

  // Clear cache on user change
  const clearCache = useCallback(() => {
    accessCache.current.clear();
  }, []);

  return { 
    checkFullAccess, 
    isPurchased, 
    invalidateCache,
    clearCache,
    purchasedTrackIds 
  };
}
