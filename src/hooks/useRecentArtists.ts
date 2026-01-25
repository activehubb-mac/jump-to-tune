import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecentArtist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  lastPlayedAt: number;
}

const STORAGE_KEY = "jumtunes_recently_played";

export function useRecentArtists(limit: number = 10) {
  const [artistIds, setArtistIds] = useState<{ id: string; playedAt: number }[]>([]);

  // Extract unique artist IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          artist_id: string;
          playedAt: number;
        }>;
        
        // Dedupe by artist_id, keep the most recent playedAt
        const artistMap = new Map<string, number>();
        parsed.forEach((track) => {
          if (track.artist_id) {
            const existing = artistMap.get(track.artist_id);
            if (!existing || track.playedAt > existing) {
              artistMap.set(track.artist_id, track.playedAt);
            }
          }
        });
        
        // Convert to array and sort by most recent
        const uniqueArtists = Array.from(artistMap.entries())
          .map(([id, playedAt]) => ({ id, playedAt }))
          .sort((a, b) => b.playedAt - a.playedAt)
          .slice(0, limit);
        
        setArtistIds(uniqueArtists);
      }
    } catch (e) {
      console.error("Failed to load recent artists:", e);
    }
  }, [limit]);

  // Fetch artist profiles from Supabase
  const { data: recentArtists = [], isLoading } = useQuery({
    queryKey: ["recent-artists", artistIds.map((a) => a.id)],
    queryFn: async (): Promise<RecentArtist[]> => {
      if (artistIds.length === 0) return [];

      const ids = artistIds.map((a) => a.id);
      const { data, error } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", ids);

      if (error) throw error;
      if (!data) return [];

      // Map with playedAt and sort by most recent
      const playedAtMap = new Map(artistIds.map((a) => [a.id, a.playedAt]));
      return data
        .map((artist) => ({
          id: artist.id!,
          display_name: artist.display_name,
          avatar_url: artist.avatar_url,
          lastPlayedAt: playedAtMap.get(artist.id!) || 0,
        }))
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    },
    enabled: artistIds.length > 0,
  });

  return { recentArtists, isLoading };
}

