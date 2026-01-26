import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecentlyViewedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  artist_id: string;
  artist_name: string | null;
  audio_url: string | null;
  duration: number | null;
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

  // Hydrate any older entries missing audio_url (pre-fetch so iOS play remains synchronous)
  useEffect(() => {
    let cancelled = false;

    const hydrateMissingAudioUrls = async () => {
      const missingIds = recentlyViewed
        .filter((t) => !t.audio_url)
        .map((t) => t.id);

      if (missingIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("id,audio_url,duration,price")
          .in("id", missingIds);

        if (error) throw error;
        if (!data || cancelled) return;

        const map = new Map(data.map((t) => [t.id, t] as const));

        const stored = localStorage.getItem(STORAGE_KEY);
        const existing: RecentlyViewedTrack[] = stored ? JSON.parse(stored) : [];

        const updatedAll = existing.map((t) => {
          if (t.audio_url) return t;
          const found = map.get(t.id);
          if (!found?.audio_url) return t;
          return {
            ...t,
            audio_url: found.audio_url,
            duration: t.duration ?? found.duration ?? null,
            price: typeof t.price === "number" ? t.price : (found.price ?? 0),
          };
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
        setRecentlyViewed(updatedAll.slice(0, limit));
      } catch (e) {
        console.warn("Failed to hydrate recently viewed audio URLs:", e);
      }
    };

    hydrateMissingAudioUrls();
    return () => {
      cancelled = true;
    };
  }, [recentlyViewed, limit]);

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
    audio_url?: string | null;
    duration?: number | null;
    price: number;
  }) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let existing: RecentlyViewedTrack[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      existing = existing.filter((t) => t.id !== track.id);
      
      // Add to front with timestamp - include audio_url for iOS playback
      const newTrack: RecentlyViewedTrack = {
        id: track.id,
        title: track.title,
        cover_art_url: track.cover_art_url,
        artist_id: track.artist_id,
        artist_name: track.artist_name,
        audio_url: track.audio_url || null,
        duration: track.duration || null,
        price: track.price,
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
