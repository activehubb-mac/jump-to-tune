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
  } | null;
  trackCount: number;
}

export function useLabelRoster(labelId: string | undefined) {
  return useQuery({
    queryKey: ["label-roster", labelId],
    queryFn: async (): Promise<RosterArtist[]> => {
      if (!labelId) return [];

      // Step 1: Fetch roster entries without profile join
      const { data: roster, error } = await supabase
        .from("label_roster")
        .select("id, artist_id, status, joined_at")
        .eq("label_id", labelId)
        .order("joined_at", { ascending: false });

      if (error) throw error;
      if (!roster || roster.length === 0) return [];

      // Step 2: Get unique artist IDs
      const artistIds = [...new Set(roster.map((r) => r.artist_id).filter(Boolean))];

      // Step 3: Fetch artist profiles from public view
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      // Step 4: Map artists to roster entries
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      // Step 5: Get track counts for each artist
      const rosterWithData: RosterArtist[] = await Promise.all(
        roster.map(async (r) => {
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("artist_id", r.artist_id)
            .eq("label_id", labelId);

          return {
            ...r,
            artist: artistMap.get(r.artist_id) || null,
            trackCount: trackCount || 0,
          };
        })
      );

      return rosterWithData;
    },
    enabled: !!labelId,
  });
}
