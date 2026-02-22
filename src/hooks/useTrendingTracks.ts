import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePinnedHomepageContent } from "./usePinnedHomepageContent";

export interface TrendingTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  artist_id: string;
  artist_name: string | null;
  artist_avatar: string | null;
  has_karaoke: boolean | null;
  engagement_score: number;
}

export function useTrendingTracks(limit: number = 6) {
  const { data: pinnedItems } = usePinnedHomepageContent("home_trending");

  return useQuery({
    queryKey: ["trendingTracks", limit, pinnedItems?.map(p => p.content_id)],
    queryFn: async (): Promise<TrendingTrack[]> => {
      const pinnedTrackIds = (pinnedItems || [])
        .filter(p => p.content_type === "track")
        .map(p => p.content_id);

      // Helper to enrich tracks with artist data
      const enrichWithArtists = async (tracks: any[], engMap: Map<string, number>): Promise<TrendingTrack[]> => {
        if (!tracks || tracks.length === 0) return [];
        const artistIds = [...new Set(tracks.map(t => t.artist_id).filter(Boolean))];
        const { data: artists } = await supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds);
        const artistMap = new Map(artists?.map(a => [a.id, a]) || []);
        return tracks.map(track => {
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
            has_karaoke: track.has_karaoke || null,
            engagement_score: engMap.get(track.id) || 0,
          };
        });
      };

      // Fetch pinned tracks
      let pinnedTracks: TrendingTrack[] = [];
      if (pinnedTrackIds.length > 0) {
        const { data: pTracks } = await supabase
          .from("tracks")
          .select("id, title, audio_url, cover_art_url, price, artist_id, has_karaoke")
          .in("id", pinnedTrackIds)
          .eq("is_draft", false);
        if (pTracks) {
          const orderedPinned = pinnedTrackIds
            .map(id => pTracks.find(t => t.id === id))
            .filter(Boolean);
          pinnedTracks = await enrichWithArtists(orderedPinned, new Map());
          // Give pinned items a high engagement score for display
          pinnedTracks = pinnedTracks.map(t => ({ ...t, engagement_score: 999 }));
        }
      }

      // Get recent engagement data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: purchaseCounts, error: purchaseError } = await supabase
        .from("purchases")
        .select("track_id")
        .gte("purchased_at", thirtyDaysAgo.toISOString());
      if (purchaseError) throw purchaseError;

      const { data: likeCounts, error: likeError } = await supabase
        .from("likes")
        .select("track_id")
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (likeError) throw likeError;

      const engagementMap = new Map<string, number>();
      purchaseCounts?.forEach(p => {
        engagementMap.set(p.track_id, (engagementMap.get(p.track_id) || 0) + 3);
      });
      likeCounts?.forEach(l => {
        engagementMap.set(l.track_id, (engagementMap.get(l.track_id) || 0) + 1);
      });

      const sortedTrackIds = Array.from(engagementMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([trackId]) => trackId)
        .filter(id => !pinnedTrackIds.includes(id));

      let organicTracks: TrendingTrack[] = [];
      if (sortedTrackIds.length > 0) {
        const { data: tracks, error } = await supabase
          .from("tracks")
          .select("id, title, audio_url, cover_art_url, price, artist_id, has_karaoke")
          .in("id", sortedTrackIds)
          .eq("is_draft", false);
        if (error) throw error;

        const trackMap = new Map(tracks?.map(t => [t.id, t]));
        const sortedTracks = sortedTrackIds
          .filter(id => trackMap.has(id))
          .map(id => trackMap.get(id)!);
        organicTracks = await enrichWithArtists(sortedTracks, engagementMap);
      }

      if (organicTracks.length === 0 && pinnedTracks.length === 0) {
        // Fallback: recent published tracks
        const { data: recentTracks, error } = await supabase
          .from("tracks")
          .select("id, title, audio_url, cover_art_url, price, artist_id, has_karaoke")
          .eq("is_draft", false)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        organicTracks = await enrichWithArtists(recentTracks || [], engagementMap);
      }

      return [...pinnedTracks, ...organicTracks].slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
}
