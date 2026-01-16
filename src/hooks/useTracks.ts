import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  price: number;
  total_editions: number;
  editions_sold: number;
  cover_art_url: string | null;
  audio_url: string;
  duration: number | null;
  has_karaoke: boolean | null;
  is_draft: boolean | null;
  created_at: string;
  artist_id: string;
  label_id: string | null;
  artist?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseTracksOptions {
  artistId?: string;
  labelId?: string;
  publishedOnly?: boolean;
  genre?: string;
  limit?: number;
  searchQuery?: string;
}

export function useTracks(options: UseTracksOptions = {}) {
  const { artistId, labelId, publishedOnly = false, genre, limit, searchQuery } = options;

  return useQuery({
    queryKey: ["tracks", options],
    queryFn: async (): Promise<Track[]> => {
      // Step 1: Fetch tracks without profile join (RLS blocks profiles for other users)
      let query = supabase
        .from("tracks")
        .select("*")
        .order("created_at", { ascending: false });

      if (artistId) {
        query = query.eq("artist_id", artistId);
      }

      if (labelId) {
        query = query.eq("label_id", labelId);
      }

      if (publishedOnly) {
        query = query.eq("is_draft", false);
      }

      if (genre && genre !== "All") {
        query = query.eq("genre", genre);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: tracks, error } = await query;

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
      
      return tracks.map((track) => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null,
      }));
    },
  });
}

export function useArtistTracks(artistId: string | undefined) {
  return useTracks({ artistId, publishedOnly: false });
}

export function useLabelTracks(labelId: string | undefined) {
  return useTracks({ labelId, publishedOnly: false });
}

export function usePublishedTracks(options: Omit<UseTracksOptions, "publishedOnly"> = {}) {
  return useTracks({ ...options, publishedOnly: true });
}

export function useTrendingTracks(limit: number = 6) {
  return useTracks({ publishedOnly: true, limit });
}
