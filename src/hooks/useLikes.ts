import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLikes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all liked track IDs for current user
  const { data: likedTrackIds = [], isLoading } = useQuery({
    queryKey: ["likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("likes")
        .select("track_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((like) => like.track_id);
    },
    enabled: !!user,
  });

  const toggleLike = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) throw new Error("Must be logged in to like tracks");

      const isLiked = likedTrackIds.includes(trackId);

      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", trackId);

        if (error) throw error;
        return { action: "unliked", trackId };
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, track_id: trackId });

        if (error) throw error;
        return { action: "liked", trackId };
      }
    },
    onMutate: async (trackId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["likes", user?.id] });

      // Snapshot previous value
      const previousLikes = queryClient.getQueryData<string[]>(["likes", user?.id]);

      // Optimistically update
      queryClient.setQueryData<string[]>(["likes", user?.id], (old = []) => {
        if (old.includes(trackId)) {
          return old.filter((id) => id !== trackId);
        }
        return [...old, trackId];
      });

      return { previousLikes };
    },
    onError: (_err, _trackId, context) => {
      // Rollback on error
      if (context?.previousLikes) {
        queryClient.setQueryData(["likes", user?.id], context.previousLikes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["likes", user?.id] });
    },
  });

  const isLiked = (trackId: string) => likedTrackIds.includes(trackId);

  return {
    likedTrackIds,
    isLoading,
    isLiked,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  };
}
