import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SuperfanSubscription {
  id: string;
  membership_id: string;
  artist_id: string;
  fan_id: string;
  status: string;
  tier_level: string;
  lifetime_spent_cents: number;
  stripe_subscription_id: string | null;
  subscribed_at: string;
  created_at: string;
}

export function useSuperfanStatus(artistId: string | undefined, fanId: string | undefined) {
  return useQuery({
    queryKey: ["superfan-status", artistId, fanId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("superfan_subscribers")
        .select("*")
        .eq("artist_id", artistId!)
        .eq("fan_id", fanId!)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as SuperfanSubscription | null;
    },
    enabled: !!artistId && !!fanId,
  });
}
