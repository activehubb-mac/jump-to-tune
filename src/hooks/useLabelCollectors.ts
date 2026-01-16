import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Collector {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_spent: number;
  tracks_owned: number;
  first_purchase: string;
}

export function useLabelCollectors(labelId: string | undefined) {
  return useQuery({
    queryKey: ["label-collectors", labelId],
    queryFn: async (): Promise<Collector[]> => {
      if (!labelId) return [];

      // Get all tracks for this label
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("label_id", labelId);

      if (!tracks || tracks.length === 0) return [];

      const trackIds = tracks.map((t) => t.id);

      // Get purchases for these tracks with user info
      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          user_id,
          price_paid,
          purchased_at
        `)
        .in("track_id", trackIds);

      if (!purchases || purchases.length === 0) return [];

      // Aggregate by user
      const userMap = new Map<string, {
        total_spent: number;
        tracks_owned: number;
        first_purchase: string;
      }>();

      purchases.forEach((p) => {
        const existing = userMap.get(p.user_id);
        if (existing) {
          existing.total_spent += Number(p.price_paid);
          existing.tracks_owned += 1;
          if (new Date(p.purchased_at) < new Date(existing.first_purchase)) {
            existing.first_purchase = p.purchased_at;
          }
        } else {
          userMap.set(p.user_id, {
            total_spent: Number(p.price_paid),
            tracks_owned: 1,
            first_purchase: p.purchased_at,
          });
        }
      });

      // Get profile info for each user from public view
      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      // Combine data
      return profiles?.map((profile) => {
        const userData = userMap.get(profile.id!)!;
        return {
          id: profile.id!,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          ...userData,
        };
      }).sort((a, b) => b.total_spent - a.total_spent) ?? [];
    },
    enabled: !!labelId,
  });
}
