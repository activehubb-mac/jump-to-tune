import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopSupporter {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_spent: number;
}

export function useTopSupporters(artistId: string | undefined) {
  return useQuery({
    queryKey: ["top-supporters", artistId],
    queryFn: async () => {
      // Get purchases for this artist's tracks in current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", artistId!);

      if (!tracks || tracks.length === 0) return [];

      const trackIds = tracks.map((t) => t.id);

      const { data: purchases } = await supabase
        .from("purchases")
        .select("user_id, price_paid")
        .in("track_id", trackIds)
        .gte("purchased_at", startOfMonth);

      if (!purchases || purchases.length === 0) return [];

      // Aggregate by user
      const spendMap: Record<string, number> = {};
      for (const p of purchases) {
        spendMap[p.user_id] = (spendMap[p.user_id] || 0) + Number(p.price_paid);
      }

      const sortedUsers = Object.entries(spendMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      // Get profile info
      const userIds = sortedUsers.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      return sortedUsers.map(([userId, total]) => ({
        user_id: userId,
        display_name: profileMap[userId]?.display_name || null,
        avatar_url: profileMap[userId]?.avatar_url || null,
        total_spent: total,
      })) as TopSupporter[];
    },
    enabled: !!artistId,
  });
}
