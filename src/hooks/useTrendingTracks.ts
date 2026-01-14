import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  price: number;
  artist_id: string;
  artist_name: string | null;
  artist_avatar: string | null;
  engagement_score: number;
}

export function useTrendingTracks(limit: number = 6) {
  return useQuery({
    queryKey: ["trendingTracks", limit],
    queryFn: async (): Promise<TrendingTrack[]> => {
      // Get recent purchases (last 30 days) grouped by track
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: purchaseCounts, error: purchaseError } = await supabase
        .from("purchases")
        .select("track_id")
        .gte("purchased_at", thirtyDaysAgo.toISOString());

      if (purchaseError) throw purchaseError;

      // Get recent likes (last 30 days) grouped by track
      const { data: likeCounts, error: likeError } = await supabase
        .from("likes")
        .select("track_id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (likeError) throw likeError;

      // Calculate engagement scores (purchases weighted more than likes)
      const engagementMap = new Map<string, number>();

      purchaseCounts?.forEach((p) => {
        const current = engagementMap.get(p.track_id) || 0;
        engagementMap.set(p.track_id, current + 3); // Purchases count 3x
      });

      likeCounts?.forEach((l) => {
        const current = engagementMap.get(l.track_id) || 0;
        engagementMap.set(l.track_id, current + 1); // Likes count 1x
      });

      // Sort by engagement and get top track IDs
      const sortedTrackIds = Array.from(engagementMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([trackId]) => trackId);

      // If we have trending tracks, fetch their details
      if (sortedTrackIds.length > 0) {
        const { data: tracks, error: tracksError } = await supabase
          .from("tracks")
          .select(`
            id,
            title,
            cover_art_url,
            price,
            artist_id,
            profiles!tracks_artist_id_fkey (
              display_name,
              avatar_url
            )
          `)
          .in("id", sortedTrackIds)
          .eq("is_draft", false);

        if (tracksError) throw tracksError;

        // Sort by engagement score and map to result format
        const trackMap = new Map(tracks?.map((t) => [t.id, t]));
        
        return sortedTrackIds
          .filter((id) => trackMap.has(id))
          .map((id) => {
            const track = trackMap.get(id)!;
            const profile = track.profiles as { display_name: string | null; avatar_url: string | null } | null;
            return {
              id: track.id,
              title: track.title,
              cover_art_url: track.cover_art_url,
              price: track.price,
              artist_id: track.artist_id,
              artist_name: profile?.display_name || null,
              artist_avatar: profile?.avatar_url || null,
              engagement_score: engagementMap.get(id) || 0,
            };
          });
      }

      // Fallback: Get most recent published tracks if no engagement data
      const { data: recentTracks, error: recentError } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          cover_art_url,
          price,
          artist_id,
          profiles!tracks_artist_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (recentError) throw recentError;

      return (recentTracks || []).map((track) => {
        const profile = track.profiles as { display_name: string | null; avatar_url: string | null } | null;
        return {
          id: track.id,
          title: track.title,
          cover_art_url: track.cover_art_url,
          price: track.price,
          artist_id: track.artist_id,
          artist_name: profile?.display_name || null,
          artist_avatar: profile?.avatar_url || null,
          engagement_score: 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
