import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SuperfanSettings {
  id: string;
  artist_id: string;
  loyalty_enabled: boolean;
  public_leaderboard: boolean;
  show_top_supporters: boolean;
  show_founding_fans: boolean;
  custom_level_names: Record<string, string> | null;
}

export function useArtistSuperfanSettings(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["artist-superfan-settings", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_superfan_settings" as any)
        .select("*")
        .eq("artist_id", artistId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as SuperfanSettings | null;
    },
    enabled: !!artistId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Partial<SuperfanSettings>) => {
      const { error } = await supabase
        .from("artist_superfan_settings" as any)
        .upsert(
          { artist_id: user!.id, ...updates } as any,
          { onConflict: "artist_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-superfan-settings"] });
    },
  });

  return { settings, isLoading, upsertSettings };
}
