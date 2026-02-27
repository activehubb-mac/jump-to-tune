import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GoDJProfile {
  id: string;
  user_id: string;
  is_enabled: boolean;
  enabled_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useGoDJProfile(userId?: string) {
  return useQuery({
    queryKey: ["go-dj-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("go_dj_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as GoDJProfile | null;
    },
    enabled: !!userId,
  });
}

export function useActivateGoDJ() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      // Try upsert
      const { data, error } = await supabase
        .from("go_dj_profiles")
        .upsert(
          {
            user_id: user.id,
            is_enabled: true,
            enabled_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-profile", user?.id] });
    },
  });
}
