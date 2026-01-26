import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecentlyPlayedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  artist_id: string;
  artist_name: string | null;
  audio_url: string | null;
  duration: number | null;
  playedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_played";
const MAX_TRACKS = 20;

export function useRecentlyPlayed(limit: number = 6) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyPlayedTrack[];
        setRecentlyPlayed(parsed.slice(0, limit));
      }
    } catch (e) {
      console.error("Failed to load recently played:", e);
    }
  }, [limit]);

  // Hydrate any older entries missing audio_url (pre-fetch so iOS play remains synchronous)
  useEffect(() => {
    let cancelled = false;

    const hydrateMissingAudioUrls = async () => {
      const missingIds = recentlyPlayed
        .filter((t) => !t.audio_url)
        .map((t) => t.id);

      if (missingIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("id,audio_url,duration")
          .in("id", missingIds);

        if (error) throw error;
        if (!data || cancelled) return;

        const map = new Map(data.map((t) => [t.id, t] as const));

        const stored = localStorage.getItem(STORAGE_KEY);
        const existing: RecentlyPlayedTrack[] = stored ? JSON.parse(stored) : [];

        const updatedAll = existing.map((t) => {
          if (t.audio_url) return t;
          const found = map.get(t.id);
          if (!found?.audio_url) return t;
          return {
            ...t,
            audio_url: found.audio_url,
            duration: t.duration ?? found.duration ?? null,
          };
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
        setRecentlyPlayed(updatedAll.slice(0, limit));
      } catch (e) {
        // Non-fatal: keep UI working; user can still play via other screens.
        console.warn("Failed to hydrate recently played audio URLs:", e);
      }
    };

    hydrateMissingAudioUrls();
    return () => {
      cancelled = true;
    };
  }, [recentlyPlayed, limit]);

  // Add a track to recently played
  const addToRecentlyPlayed = useCallback((track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    artist_id: string;
    artist_name: string | null;
    audio_url?: string | null;
    duration?: number | null;
  }) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let existing: RecentlyPlayedTrack[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      existing = existing.filter((t) => t.id !== track.id);
      
      // Add to front with timestamp - include audio_url for iOS playback
      const newTrack: RecentlyPlayedTrack = {
        id: track.id,
        title: track.title,
        cover_art_url: track.cover_art_url,
        artist_id: track.artist_id,
        artist_name: track.artist_name,
        audio_url: track.audio_url || null,
        duration: track.duration || null,
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
