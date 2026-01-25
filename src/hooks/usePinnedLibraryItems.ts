import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jumtunes_pinned_library";

export interface PinnedItem {
  id: string;
  type: "playlist" | "artist" | "album";
  pinnedAt: number;
}

export function usePinnedLibraryItems() {
  const { user } = useAuth();
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);

  // Load from localStorage on mount (user-scoped)
  useEffect(() => {
    if (!user) {
      setPinnedItems([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        setPinnedItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load pinned items:", e);
    }
  }, [user]);

  const saveToStorage = useCallback((items: PinnedItem[]) => {
    if (!user) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save pinned items:", e);
    }
  }, [user]);

  const isPinned = useCallback((id: string, type: PinnedItem["type"]) => {
    return pinnedItems.some((item) => item.id === id && item.type === type);
  }, [pinnedItems]);

  const togglePin = useCallback((id: string, type: PinnedItem["type"]) => {
    setPinnedItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.id === id && item.type === type
      );

      let updated: PinnedItem[];
      if (existingIndex >= 0) {
        // Unpin
        updated = current.filter((_, i) => i !== existingIndex);
      } else {
        // Pin
        updated = [...current, { id, type, pinnedAt: Date.now() }];
      }

      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const getPinnedIds = useCallback((type?: PinnedItem["type"]) => {
    if (type) {
      return pinnedItems.filter((item) => item.type === type).map((item) => item.id);
    }
    return pinnedItems.map((item) => item.id);
  }, [pinnedItems]);

  return {
    pinnedItems,
    isPinned,
    togglePin,
    getPinnedIds,
  };
}
