import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const ALLOWED_EMOJIS = ["🔥", "💎", "🚀", "👍", "👏"] as const;

export interface ReactionCounts {
  [emoji: string]: number;
}

export function useAnnouncementReactions(announcementId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions = [] } = useQuery({
    queryKey: ["announcement-reactions", announcementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_reactions")
        .select("emoji, user_id")
        .eq("announcement_id", announcementId!);
      if (error) throw error;
      return data;
    },
    enabled: !!announcementId,
  });

  const reactionCounts: ReactionCounts = {};
  let userReaction: string | null = null;
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    if (r.user_id === user?.id) userReaction = r.emoji;
  });

  const toggleReaction = useMutation({
    mutationFn: async (emoji: string) => {
      if (userReaction === emoji) {
        // Remove reaction
        const { error } = await supabase
          .from("announcement_reactions")
          .delete()
          .eq("announcement_id", announcementId!)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else if (userReaction) {
        // Update reaction
        const { error } = await supabase
          .from("announcement_reactions")
          .update({ emoji })
          .eq("announcement_id", announcementId!)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("announcement_reactions")
          .insert({ announcement_id: announcementId!, user_id: user!.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-reactions", announcementId] });
    },
  });

  return { reactionCounts, userReaction, toggleReaction, totalReactions: reactions.length };
}
