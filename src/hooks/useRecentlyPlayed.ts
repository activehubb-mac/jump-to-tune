import { useState, useMemo, useCallback } from "react";

export interface RecentlyPlayedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  audio_url: string;
  duration?: number | null;
  artist_id: string;
  artist_name: string | null;
  playedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_played";
const MAX_TRACKS = 20;

// Helper to validate audio URL format (outside hook to avoid recreations)
const isValidAudioUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  return cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".flac") || cleanUrl.endsWith(".m4a") || cleanUrl.endsWith(".aac");
};

// Get initial state from localStorage synchronously to prevent flicker
const getInitialRecentlyPlayed = (): RecentlyPlayedTrack[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RecentlyPlayedTrack[];
      const validTracks = parsed.filter(t => t.audio_url && isValidAudioUrl(t.audio_url));
      
      // If we filtered out corrupted data, update localStorage
      if (validTracks.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validTracks));
      }
      
      return validTracks;
    }
  } catch (e) {
    console.error("Failed to load recently played:", e);
    localStorage.removeItem(STORAGE_KEY);
  }
  return [];
};

export function useRecentlyPlayed(limit: number = 6) {
  // Initialize with data from localStorage to prevent flicker
  const [allRecentlyPlayed, setAllRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(getInitialRecentlyPlayed);
  
  // Derive the limited list from the full list (avoids re-fetching on limit change)
  const recentlyPlayed = useMemo(() => 
    allRecentlyPlayed.slice(0, limit), 
    [allRecentlyPlayed, limit]
  );

  // Add a track to recently played
  const addToRecentlyPlayed = useCallback((track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string;
    duration?: number | null;
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
      setAllRecentlyPlayed(existing);
    } catch (e) {
      console.error("Failed to save recently played:", e);
    }
  }, []);

  return { recentlyPlayed, addToRecentlyPlayed };
}
