import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KaraokeTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  artist_id: string;
  artist_name: string | null;
  has_karaoke: boolean;
}

export function useTopKaraokeTracks(limit = 10) {
  return useQuery({
    queryKey: ["topKaraokeTracks", limit],
    queryFn: async (): Promise<KaraokeTrack[]> => {
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, artist_id, has_karaoke")
        .eq("is_draft", false)
        .eq("has_karaoke", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!tracks || tracks.length === 0) return [];

      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return tracks.map((t) => ({
        id: t.id,
        title: t.title,
        audio_url: t.audio_url,
        cover_art_url: t.cover_art_url,
        artist_id: t.artist_id,
        artist_name: artistMap.get(t.artist_id)?.display_name || null,
        has_karaoke: true,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
