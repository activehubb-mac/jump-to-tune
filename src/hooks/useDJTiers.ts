import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DJTier {
  id: string;
  artist_id: string;
  lifetime_listeners: number;
  current_tier: number;
  max_slots: number;
  badge_name: string | null;
  updated_at: string;
}

export function useDJTier(artistId?: string) {
  return useQuery({
    queryKey: ["dj-tier", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_tiers")
        .select("*")
        .eq("artist_id", artistId!)
        .maybeSingle();

      if (error) throw error;
      return data as DJTier | null;
    },
    enabled: !!artistId,
  });
}

export function getTierInfo(tier: number) {
  switch (tier) {
    case 3:
      return { name: "Verified Curator", badge: "⭐", color: "text-yellow-400", nextThreshold: null };
    case 2:
      return { name: "Rising Curator", badge: "🔥", color: "text-orange-400", nextThreshold: 5000 };
    default:
      return { name: "DJ", badge: "🎛", color: "text-muted-foreground", nextThreshold: 1000 };
  }
}
