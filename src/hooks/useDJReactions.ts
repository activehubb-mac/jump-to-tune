import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DJEmoji = "🔥" | "🎧" | "⭐" | "🚀";

export const DJ_EMOJIS: DJEmoji[] = ["🔥", "🎧", "⭐", "🚀"];

interface ReactionCounts {
  [emoji: string]: number;
}

export function useDJReactions(sessionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ["dj-reactions", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_reactions")
        .select("emoji")
        .eq("session_id", sessionId!);

      if (error) throw error;

      const counts: ReactionCounts = {};
      DJ_EMOJIS.forEach((e) => (counts[e] = 0));
      data?.forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      });
      return counts;
    },
    enabled: !!sessionId,
  });

  const { data: userReaction } = useQuery({
    queryKey: ["dj-user-reaction", sessionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("dj_reactions")
        .select("emoji")
        .eq("session_id", sessionId!)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.emoji as DJEmoji | null;
    },
    enabled: !!sessionId && !!user,
  });

  const reactMutation = useMutation({
    mutationFn: async (emoji: DJEmoji) => {
      if (!user || !sessionId) throw new Error("Must be logged in");

      if (userReaction === emoji) {
        // Remove reaction
        const { error } = await supabase
          .from("dj_reactions")
          .delete()
          .eq("session_id", sessionId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (userReaction) {
        // Change reaction
        const { error } = await supabase
          .from("dj_reactions")
          .update({ emoji })
          .eq("session_id", sessionId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("dj_reactions")
          .insert({ session_id: sessionId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-reactions", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["dj-user-reaction", sessionId] });
    },
  });

  return {
    reactions: reactions || {},
    userReaction: userReaction || null,
    react: reactMutation.mutate,
    isReacting: reactMutation.isPending,
  };
}
