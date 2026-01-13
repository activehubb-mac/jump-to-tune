import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RosterArtist {
  id: string;
  artist_id: string;
  status: string;
  joined_at: string;
  artist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  trackCount: number;
}

export function useLabelRoster(labelId: string | undefined) {
  return useQuery({
    queryKey: ["label-roster", labelId],
    queryFn: async (): Promise<RosterArtist[]> => {
      if (!labelId) return [];

      const { data: roster, error } = await supabase
        .from("label_roster")
        .select(`
          id,
          artist_id,
          status,
          joined_at,
          artist:profiles!label_roster_artist_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("label_id", labelId)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      // Get track counts for each artist
      const rosterWithCounts: RosterArtist[] = await Promise.all(
        (roster || []).map(async (r) => {
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("artist_id", r.artist_id)
            .eq("label_id", labelId);

          return {
            ...r,
            trackCount: trackCount || 0,
          };
        })
      );

      return rosterWithCounts;
    },
    enabled: !!labelId,
  });
}
