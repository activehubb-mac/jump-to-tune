import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedOnTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  duration: number | null;
  editions_sold: number;
  total_editions: number;
  created_at: string;
  primary_artist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useFeaturedOnTracks(artistId: string | undefined) {
  return useQuery({
    queryKey: ["featured-on-tracks", artistId],
    queryFn: async (): Promise<FeaturedOnTrack[]> => {
      if (!artistId) return [];

      // Get track IDs where this artist is featured
      const { data: featuredData, error: featuredError } = await supabase
        .from("track_features")
        .select("track_id")
        .eq("artist_id", artistId);

      if (featuredError) throw featuredError;
      if (!featuredData || featuredData.length === 0) return [];

      const trackIds = featuredData.map((f) => f.track_id);

      // Get full track details for published tracks only
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          audio_url,
          cover_art_url,
          price,
          duration,
          editions_sold,
          total_editions,
          created_at,
          artist_id
        `)
        .in("id", trackIds)
        .eq("is_draft", false)
        .order("created_at", { ascending: false });

      if (tracksError) throw tracksError;
      if (!tracks || tracks.length === 0) return [];

      // Get primary artist info for each track
      const artistIds = [...new Set(tracks.map((t) => t.artist_id))];
      const { data: artists, error: artistsError } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      if (artistsError) throw artistsError;

      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return tracks.map((track) => ({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url,
        price: track.price,
        duration: track.duration,
        editions_sold: track.editions_sold,
        total_editions: track.total_editions,
        created_at: track.created_at,
        primary_artist: artistMap.get(track.artist_id) || {
          id: track.artist_id,
          display_name: null,
          avatar_url: null,
        },
      }));
    },
    enabled: !!artistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
