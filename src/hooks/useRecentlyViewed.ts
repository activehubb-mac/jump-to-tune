import { useState, useEffect, useCallback } from "react";

export interface RecentlyViewedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  audio_url: string;
  duration?: number | null;
  artist_id: string;
  artist_name: string | null;
  price: number;
  viewedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_viewed";
const MAX_TRACKS = 10;

export function useRecentlyViewed(limit: number = 5) {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTrack[]>([]);

  // Helper to validate audio URL format
  const isValidAudioUrl = (url: string): boolean => {
    if (!url || url.trim() === "") return false;
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    return cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".flac") || cleanUrl.endsWith(".m4a") || cleanUrl.endsWith(".aac");
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedTrack[];
        // Filter out tracks without valid audio_url (old format or corrupted URLs like .mo3)
        const validTracks = parsed.filter(t => t.audio_url && isValidAudioUrl(t.audio_url));
        
        // If we filtered out corrupted data, update localStorage
        if (validTracks.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validTracks));
          console.log("[RecentlyViewed] Cleaned", parsed.length - validTracks.length, "corrupted entries");
        }
        
        setRecentlyViewed(validTracks.slice(0, limit));
      }
    } catch (e) {
      console.error("Failed to load recently viewed:", e);
      // Clear corrupted localStorage
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [limit]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as RecentlyViewedTrack[];
          const validTracks = parsed.filter(t => t.audio_url);
          setRecentlyViewed(validTracks.slice(0, limit));
        } catch (err) {
          console.error("Failed to parse recently viewed:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [limit]);

  // Add a track to recently viewed (now requires audio_url for Safari compatibility)
  const addToRecentlyViewed = useCallback((track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string;
    duration?: number | null;
    artist_id: string;
    artist_name: string | null;
    price: number;
  }) => {
    // Don't save tracks without audio_url
    if (!track.audio_url) {
      console.warn("Skipping recently viewed - no audio_url");
      return;
    }
    
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
