import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePurchases() {
  const { user } = useAuth();

  const { data: purchasedTrackIds = [], isLoading } = useQuery({
    queryKey: ["user-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("track_id")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data?.map((p) => p.track_id) || [];
    },
    enabled: !!user,
  });

  const isOwned = (trackId: string) => purchasedTrackIds.includes(trackId);

  return { isOwned, purchasedTrackIds, isLoading };
}
