import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePinnedHomepageContent } from "./usePinnedHomepageContent";

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
  const { data: pinnedItems } = usePinnedHomepageContent("home_new_releases");

  return useQuery({
    queryKey: ["newReleases", limit, lookbackDays, pinnedItems?.map(p => p.content_id)],
    queryFn: async (): Promise<NewRelease[]> => {
      const pinnedTrackIds = (pinnedItems || [])
        .filter(p => p.content_type === "track")
        .map(p => p.content_id);

      // Fetch pinned tracks
      let pinnedTracks: NewRelease[] = [];
      if (pinnedTrackIds.length > 0) {
        const { data: pTracks } = await supabase
          .from("tracks")
          .select("id, title, audio_url, cover_art_url, price, artist_id, created_at")
          .in("id", pinnedTrackIds)
          .eq("is_draft", false);

        if (pTracks && pTracks.length > 0) {
          const artistIds = [...new Set(pTracks.map(t => t.artist_id).filter(Boolean))];
          const { data: artists } = await supabase
            .from("profiles_public")
            .select("id, display_name, avatar_url")
            .in("id", artistIds);
          const artistMap = new Map(artists?.map(a => [a.id, a]) || []);

          pinnedTracks = pinnedTrackIds
            .map(id => pTracks.find(t => t.id === id))
            .filter(Boolean)
            .map(track => {
              const artist = artistMap.get(track!.artist_id);
              return {
                id: track!.id,
                title: track!.title,
                audio_url: track!.audio_url,
                cover_art_url: track!.cover_art_url,
                price: track!.price,
                artist_id: track!.artist_id,
                artist_name: artist?.display_name || null,
                artist_avatar: artist?.avatar_url || null,
                created_at: track!.created_at,
              };
            });
        }
      }

      // Fetch organic new releases
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - lookbackDays);

      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, price, artist_id, created_at")
        .eq("is_draft", false)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const organicTracks = (tracks || []).filter(t => !pinnedTrackIds.includes(t.id));
      if (organicTracks.length === 0 && pinnedTracks.length === 0) return [];

      const artistIds = [...new Set(organicTracks.map(t => t.artist_id).filter(Boolean))];
      let artistMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds);
        artistMap = new Map(artists?.map(a => [a.id, a]) || []);
      }

      const organicResults: NewRelease[] = organicTracks.map(track => {
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

      return [...pinnedTracks, ...organicResults].slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
}
