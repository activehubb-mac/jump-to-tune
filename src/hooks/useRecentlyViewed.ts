import { useState, useEffect, useCallback } from "react";

export interface RecentlyViewedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  artist_id: string;
  artist_name: string | null;
  price: number;
  viewedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_viewed";
const MAX_TRACKS = 10;

export function useRecentlyViewed(limit: number = 5) {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTrack[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedTrack[];
        setRecentlyViewed(parsed.slice(0, limit));
      }
    } catch (e) {
      console.error("Failed to load recently viewed:", e);
    }
  }, [limit]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as RecentlyViewedTrack[];
          setRecentlyViewed(parsed.slice(0, limit));
        } catch (err) {
          console.error("Failed to parse recently viewed:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [limit]);

  // Add a track to recently viewed
  const addToRecentlyViewed = useCallback((track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    artist_id: string;
    artist_name: string | null;
    price: number;
  }) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let existing: RecentlyViewedTrack[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      existing = existing.filter((t) => t.id !== track.id);
      
      // Add to front with timestamp
      const newTrack: RecentlyViewedTrack = {
        ...track,
        viewedAt: Date.now(),
      };
      
      existing = [newTrack, ...existing].slice(0, MAX_TRACKS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      setRecentlyViewed(existing.slice(0, limit));
    } catch (e) {
      console.error("Failed to save recently viewed:", e);
    }
  }, [limit]);

  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentlyViewed([]);
  }, []);

  return { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed };
}
