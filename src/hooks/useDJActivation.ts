import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDJActivation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isActivated, isLoading } = useQuery({
    queryKey: ["dj-activation", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_tiers")
        .select("id")
        .eq("artist_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const activate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("dj_tiers")
        .insert({
          artist_id: user.id,
          current_tier: 1,
          lifetime_listeners: 0,
          max_slots: 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-activation", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dj-tier", user?.id] });
    },
  });

  return { isActivated: !!isActivated, isLoading, activate };
}
