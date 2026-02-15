import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useArtistAlbums(artistId: string | undefined) {
  return useQuery({
    queryKey: ["albums", "artist", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });
}

export function useLabelAlbums(labelId: string | undefined) {
  return useQuery({
    queryKey: ["albums", "label", labelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("label_id", labelId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!labelId,
  });
}
