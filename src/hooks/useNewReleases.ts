import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewRelease {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  artist_id: string;
  artist_name: string | null;
  artist_avatar: string | null;
  created_at: string;
}

export function useNewReleases(limit: number = 6, lookbackDays: number = 7) {
  return useQuery({
    queryKey: ["newReleases", limit, lookbackDays],
    queryFn: async (): Promise<NewRelease[]> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - lookbackDays);

      // Step 1: Fetch tracks without profile join
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, price, artist_id, created_at")
        .eq("is_draft", false)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!tracks || tracks.length === 0) return [];

      // Step 2: Get unique artist IDs
      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];

      // Step 3: Fetch artist profiles from public view
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      // Step 4: Map artists to tracks
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return tracks.map((track) => {
        const artist = artistMap.get(track.artist_id);
        return {
          id: track.id,
          title: track.title,
          audio_url: track.audio_url,
          cover_art_url: track.cover_art_url,
          price: track.price,
          artist_id: track.artist_id,
          artist_name: artist?.display_name || null,
          artist_avatar: artist?.avatar_url || null,
          created_at: track.created_at,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
