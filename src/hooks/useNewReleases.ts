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

export function useNewReleases(limit: number = 6) {
  return useQuery({
    queryKey: ["newReleases", limit],
    queryFn: async (): Promise<NewRelease[]> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          audio_url,
          cover_art_url,
          price,
          artist_id,
          created_at,
          profiles!tracks_artist_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq("is_draft", false)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((track) => {
        const profile = track.profiles as { display_name: string | null; avatar_url: string | null } | null;
        return {
          id: track.id,
          title: track.title,
          audio_url: track.audio_url,
          cover_art_url: track.cover_art_url,
          price: track.price,
          artist_id: track.artist_id,
          artist_name: profile?.display_name || null,
          artist_avatar: profile?.avatar_url || null,
          created_at: track.created_at,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
