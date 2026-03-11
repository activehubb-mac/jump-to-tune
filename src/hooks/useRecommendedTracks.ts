import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecommendedTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  artist_id: string;
  artist_name: string | null;
  has_karaoke: boolean | null;
}

export function useRecommendedTracks(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendedTracks", user?.id, limit],
    queryFn: async (): Promise<RecommendedTrack[]> => {
      // If logged in, recommend tracks from followed artists or liked genres
      // For now, use a simple approach: recently popular tracks the user hasn't liked
      let excludeIds: string[] = [];

      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("track_id")
          .eq("user_id", user.id)
          .limit(50);
        excludeIds = likes?.map((l) => l.track_id) || [];
      }

      let query = supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, artist_id, has_karaoke")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(limit + excludeIds.length);

      const { data: tracks, error } = await query;
      if (error) throw error;
      if (!tracks || tracks.length === 0) return [];

      const filtered = tracks
        .filter((t) => !excludeIds.includes(t.id))
        .slice(0, limit);

      const artistIds = [...new Set(filtered.map((t) => t.artist_id).filter(Boolean))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return filtered.map((t) => ({
        id: t.id,
        title: t.title,
        audio_url: t.audio_url,
        cover_art_url: t.cover_art_url,
        artist_id: t.artist_id,
        artist_name: artistMap.get(t.artist_id)?.display_name || null,
        has_karaoke: t.has_karaoke,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
