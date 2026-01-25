import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jumtunes_pinned_library";

export interface PinnedItem {
  id: string;
  type: "playlist" | "artist" | "album";
  pinnedAt: number;
}

// Simple event emitter for cross-component updates
const pinnedItemsEventTarget = new EventTarget();
const PINNED_CHANGE_EVENT = "pinned-items-changed";

function emitChange() {
  pinnedItemsEventTarget.dispatchEvent(new Event(PINNED_CHANGE_EVENT));
}

function getStoredItems(userId: string): PinnedItem[] {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load pinned items:", e);
  }
  return [];
}

function saveItems(userId: string, items: PinnedItem[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save pinned items:", e);
  }
  emitChange();
}

export function usePinnedLibraryItems() {
  const { user } = useAuth();
  const userId = user?.id || "";
  
  // Local state that syncs with localStorage
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(() => 
    getStoredItems(userId)
  );

  // Reload from localStorage when userId changes
  useEffect(() => {
    setPinnedItems(getStoredItems(userId));
  }, [userId]);

  // Listen for changes from other component instances
  useEffect(() => {
    const handleChange = () => {
      setPinnedItems(getStoredItems(userId));
    };
    
    pinnedItemsEventTarget.addEventListener(PINNED_CHANGE_EVENT, handleChange);
    return () => {
      pinnedItemsEventTarget.removeEventListener(PINNED_CHANGE_EVENT, handleChange);
    };
  }, [userId]);

  const isPinned = useCallback((id: string, type: PinnedItem["type"]) => {
    return pinnedItems.some((item) => item.id === id && item.type === type);
  }, [pinnedItems]);

  const togglePin = useCallback((id: string, type: PinnedItem["type"]) => {
    if (!userId) return;
    
    const current = getStoredItems(userId);
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

    saveItems(userId, updated);
    // Immediately update local state too
    setPinnedItems(updated);
  }, [userId]);

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
