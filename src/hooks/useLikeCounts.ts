import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLikeCounts(trackIds: string[]) {
  return useQuery({
    queryKey: ["likeCounts", trackIds],
    queryFn: async () => {
      if (trackIds.length === 0) return {};

      const { data, error } = await supabase
        .from("likes")
        .select("track_id")
        .in("track_id", trackIds);

      if (error) throw error;

      // Count likes per track
      const counts: Record<string, number> = {};
      trackIds.forEach((id) => {
        counts[id] = 0;
      });
      
      data?.forEach((like) => {
        counts[like.track_id] = (counts[like.track_id] || 0) + 1;
      });

      return counts;
    },
    enabled: trackIds.length > 0,
  });
}
