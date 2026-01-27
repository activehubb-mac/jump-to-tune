import { useState, useEffect, useCallback } from "react";

export interface RecentlyPlayedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  audio_url: string;
  duration?: number | null;
  price?: number;
  artist_id: string;
  artist_name: string | null;
  playedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_played";
const MAX_TRACKS = 20;

export function useRecentlyPlayed(limit: number = 6) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);

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
        const parsed = JSON.parse(stored) as RecentlyPlayedTrack[];
        // Filter out tracks without valid audio_url (old format or corrupted URLs like .mo3)
        const validTracks = parsed.filter(t => t.audio_url && isValidAudioUrl(t.audio_url));
        
        // If we filtered out corrupted data, update localStorage
        if (validTracks.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validTracks));
          console.log("[RecentlyPlayed] Cleaned", parsed.length - validTracks.length, "corrupted entries");
        }
        
        setRecentlyPlayed(validTracks.slice(0, limit));
      }
    } catch (e) {
      console.error("Failed to load recently played:", e);
      // Clear corrupted localStorage
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [limit]);

  // Add a track to recently played
  const addToRecentlyPlayed = useCallback((track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string;
    duration?: number | null;
    price?: number;
    artist_id: string;
    artist_name: string | null;
  }) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let existing: RecentlyPlayedTrack[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      existing = existing.filter((t) => t.id !== track.id);
      
      // Add to front with timestamp
      const newTrack: RecentlyPlayedTrack = {
        ...track,
        playedAt: Date.now(),
      };
      
      existing = [newTrack, ...existing].slice(0, MAX_TRACKS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      setRecentlyPlayed(existing.slice(0, limit));
    } catch (e) {
      console.error("Failed to save recently played:", e);
    }
  }, [limit]);

  return { recentlyPlayed, addToRecentlyPlayed };
}
