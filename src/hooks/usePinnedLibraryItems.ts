import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jumtunes_pinned_library";

export interface PinnedItem {
  id: string;
  type: "playlist" | "artist" | "album";
  pinnedAt: number;
}

// Create a simple store for pinned items to enable real-time updates across components
let pinnedItemsStore: Map<string, PinnedItem[]> = new Map();
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getStoredItems(userId: string): PinnedItem[] {
  return pinnedItemsStore.get(userId) || [];
}

function setStoredItems(userId: string, items: PinnedItem[]) {
  pinnedItemsStore.set(userId, items);
  // Also persist to localStorage
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save pinned items:", e);
  }
  notifyListeners();
}

function loadFromLocalStorage(userId: string): PinnedItem[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      const items = JSON.parse(stored);
      pinnedItemsStore.set(userId, items);
      return items;
    }
  } catch (e) {
    console.error("Failed to load pinned items:", e);
  }
  return [];
}

export function usePinnedLibraryItems() {
  const { user } = useAuth();
  const userId = user?.id || "";

  // Use useSyncExternalStore for real-time updates across all components
  const pinnedItems = useSyncExternalStore(
    subscribe,
    () => getStoredItems(userId),
    () => [] // Server snapshot (empty for SSR)
  );

  // Load from localStorage on mount (user-scoped)
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Load from localStorage if not already in store
    if (!pinnedItemsStore.has(userId)) {
      loadFromLocalStorage(userId);
      notifyListeners();
    }
  }, [userId]);

  const isPinned = useCallback((id: string, type: PinnedItem["type"]) => {
    const items = getStoredItems(userId);
    return items.some((item) => item.id === id && item.type === type);
  }, [userId]);

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

    setStoredItems(userId, updated);
  }, [userId]);

  const getPinnedIds = useCallback((type?: PinnedItem["type"]) => {
    const items = getStoredItems(userId);
    if (type) {
      return items.filter((item) => item.type === type).map((item) => item.id);
    }
    return items.map((item) => item.id);
  }, [userId]);

  return {
    pinnedItems,
    isPinned,
    togglePin,
    getPinnedIds,
  };
}
