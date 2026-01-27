import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CollectionStats {
  tracksOwned: number;
  artistsFollowed: number;
  totalSpent: number;
  rareEditions: number;
}

interface OwnedTrack {
  id: string;
  edition_number: number;
  price_paid: number;
  purchased_at: string;
  track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string | null;
    duration: number | null;
    total_editions: number;
    album_id: string | null;
    artist_id: string;
    artist: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export function useCollectionStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["collection-stats", userId],
    queryFn: async (): Promise<CollectionStats> => {
      if (!userId) {
        return {
          tracksOwned: 0,
          artistsFollowed: 0,
          totalSpent: 0,
          rareEditions: 0,
        };
      }

      // Get purchases count
      const { data: purchases } = await supabase
        .from("purchases")
        .select("price_paid, edition_number")
        .eq("user_id", userId);

      const tracksOwned = purchases?.length || 0;
      const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.price_paid), 0) || 0;
      // Rare editions = edition number 1-10
      const rareEditions = purchases?.filter((p) => p.edition_number <= 10).length || 0;

      // Get followed artists count
      const { count: artistsFollowed } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      return {
        tracksOwned,
        artistsFollowed: artistsFollowed || 0,
        totalSpent,
        rareEditions,
      };
    },
    enabled: !!userId,
  });
}

export function useOwnedTracks(userId: string | undefined) {
  return useQuery({
    queryKey: ["owned-tracks", userId],
    queryFn: async (): Promise<OwnedTrack[]> => {
      if (!userId) return [];

      // Step 1: Fetch purchases with track data (no profile join)
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select(`
          id,
          edition_number,
          price_paid,
          purchased_at,
          track:tracks (
            id,
            title,
            cover_art_url,
            audio_url,
            duration,
            total_editions,
            artist_id,
            album_id
          )
        `)
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      if (!purchases || purchases.length === 0) return [];

      // Step 2: Get unique artist IDs from tracks
      const artistIds = [...new Set(
        purchases
          .filter((p: any) => p.track?.artist_id)
          .map((p: any) => p.track.artist_id)
      )];

      if (artistIds.length === 0) {
        return purchases.map((p: any) => ({
          ...p,
          track: p.track ? { ...p.track, artist: null } : null,
        }));
      }

      // Step 3: Fetch artist profiles from public view
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      // Step 4: Map artists to purchases
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return purchases.map((purchase: any) => ({
        ...purchase,
        track: purchase.track ? {
          ...purchase.track,
          artist: artistMap.get(purchase.track.artist_id) || null,
        } : null,
      }));
    },
    enabled: !!userId,
  });
}
