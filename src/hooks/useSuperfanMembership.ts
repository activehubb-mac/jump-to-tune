import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSuperfanMembership(artistId: string | undefined) {
  return useQuery({
    queryKey: ["superfan-membership", artistId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("superfan_memberships")
        .select("*")
        .eq("artist_id", artistId!)
        .maybeSingle();

      if (error) throw error;
      return data as {
        id: string;
        artist_id: string;
        monthly_price_cents: number;
        description: string | null;
        perks: string[];
        is_active: boolean;
        created_at: string;
        updated_at: string;
      } | null;
    },
    enabled: !!artistId,
  });
}
