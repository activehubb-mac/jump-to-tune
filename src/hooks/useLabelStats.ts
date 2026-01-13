import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LabelStats {
  artistCount: number;
  totalTracks: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  thisMonthSales: number;
}

export function useLabelStats(labelId: string | undefined) {
  return useQuery({
    queryKey: ["label-stats", labelId],
    queryFn: async (): Promise<LabelStats> => {
      if (!labelId) {
        return {
          artistCount: 0,
          totalTracks: 0,
          totalEarnings: 0,
          thisMonthEarnings: 0,
          thisMonthSales: 0,
        };
      }

      // Get artist roster count (active artists)
      const { count: artistCount } = await supabase
        .from("label_roster")
        .select("*", { count: "exact", head: true })
        .eq("label_id", labelId)
        .eq("status", "active");

      // Get total tracks count for label
      const { count: totalTracks } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("label_id", labelId);

      // Get all track IDs for this label
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("label_id", labelId);

      const trackIds = tracks?.map((t) => t.id) || [];

      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let thisMonthSales = 0;

      if (trackIds.length > 0) {
        // Get earnings from purchases
        const { data: purchases } = await supabase
          .from("purchases")
          .select("price_paid, purchased_at")
          .in("track_id", trackIds);

        if (purchases) {
          totalEarnings = purchases.reduce((sum, p) => sum + Number(p.price_paid), 0);

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
        artistCount: artistCount || 0,
        totalTracks: totalTracks || 0,
        totalEarnings,
        thisMonthEarnings,
        thisMonthSales,
      };
    },
    enabled: !!labelId,
  });
}
