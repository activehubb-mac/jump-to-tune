import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFollowerCounts(artistIds: string[]) {
  return useQuery({
    queryKey: ["followerCounts", artistIds],
    queryFn: async () => {
      if (artistIds.length === 0) return {};

      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .in("following_id", artistIds);

      if (error) throw error;

      // Count followers per artist
      const counts: Record<string, number> = {};
      artistIds.forEach((id) => {
        counts[id] = 0;
      });
      
      data?.forEach((follow) => {
        counts[follow.following_id] = (counts[follow.following_id] || 0) + 1;
      });

      return counts;
    },
    enabled: artistIds.length > 0,
  });
}
