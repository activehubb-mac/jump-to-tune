import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArtistStats {
  totalTracks: number;
  totalEarnings: number;
  collectorsCount: number;
  thisMonthEarnings: number;
  thisMonthSales: number;
}

export function useArtistStats(artistId: string | undefined) {
  return useQuery({
    queryKey: ["artist-stats", artistId],
    queryFn: async (): Promise<ArtistStats> => {
      if (!artistId) {
        return {
          totalTracks: 0,
          totalEarnings: 0,
          collectorsCount: 0,
          thisMonthEarnings: 0,
          thisMonthSales: 0,
        };
      }

      // Get total tracks count
      const { count: totalTracks } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId);

      // Get all track IDs for this artist
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", artistId);

      const trackIds = tracks?.map((t) => t.id) || [];

      let totalEarnings = 0;
      let collectorsCount = 0;
      let thisMonthEarnings = 0;
      let thisMonthSales = 0;

      if (trackIds.length > 0) {
        // Get total earnings from purchases
        const { data: purchases } = await supabase
          .from("purchases")
          .select("price_paid, user_id, purchased_at")
          .in("track_id", trackIds);

        if (purchases) {
          // Calculate total earnings (apply 85% artist share)
          totalEarnings = purchases.reduce((sum, p) => sum + Number(p.price_paid), 0);

          // Count unique collectors
          const uniqueCollectors = new Set(purchases.map((p) => p.user_id));
          collectorsCount = uniqueCollectors.size;

          // Calculate this month's stats
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthPurchases = purchases.filter(
            (p) => new Date(p.purchased_at) >= startOfMonth
          );
          thisMonthEarnings = thisMonthPurchases.reduce(
            (sum, p) => sum + Number(p.price_paid),
            0
          );
          thisMonthSales = thisMonthPurchases.length;
        }
      }

      return {
        totalTracks: totalTracks || 0,
        totalEarnings,
        collectorsCount,
        thisMonthEarnings,
        thisMonthSales,
      };
    },
    enabled: !!artistId,
  });
}
