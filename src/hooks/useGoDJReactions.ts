import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useGoDJReactions(sessionId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["go-dj-reactions", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("go_dj_reactions")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;

      // Count by reaction type
      const counts: Record<string, number> = {};
      let userReaction: string | null = null;

      (data || []).forEach((r: any) => {
        counts[r.reaction] = (counts[r.reaction] || 0) + 1;
        if (user && r.user_id === user.id) {
          userReaction = r.reaction;
        }
      });

      return { counts, userReaction, total: data?.length || 0 };
    },
    enabled: !!sessionId,
  });
}

export function useReactToMix() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      reaction,
    }: {
      sessionId: string;
      reaction: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Upsert: update if exists, insert if not
      const { error } = await supabase
        .from("go_dj_reactions")
        .upsert(
          {
            session_id: sessionId,
            user_id: user.id,
            reaction,
          },
          { onConflict: "session_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-reactions", variables.sessionId] });
    },
  });
}

export function useRemoveReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("go_dj_reactions")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", user.id);
      if (error) throw error;
      return { sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-reactions", data.sessionId] });
    },
  });
}
