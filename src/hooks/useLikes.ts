import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LikedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  audio_url: string;
  duration: number | null;
  genre: string | null;
  price: number;
  artist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  liked_at: string;
}

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
      await queryClient.cancelQueries({ queryKey: ["likedTracks", user?.id] });

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
      queryClient.invalidateQueries({ queryKey: ["likedTracks", user?.id] });
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

// Hook to fetch full track details for liked tracks
export function useLikedTracks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["likedTracks", user?.id],
    queryFn: async (): Promise<LikedTrack[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("likes")
        .select(`
          created_at,
          track:tracks!inner (
            id,
            title,
            cover_art_url,
            audio_url,
            duration,
            genre,
            price,
            is_draft,
            artist:profiles!tracks_artist_id_fkey (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform and filter out draft tracks
      return (data || [])
        .filter((like: any) => like.track && !like.track.is_draft)
        .map((like: any) => ({
          id: like.track.id,
          title: like.track.title,
          cover_art_url: like.track.cover_art_url,
          audio_url: like.track.audio_url,
          duration: like.track.duration,
          genre: like.track.genre,
          price: like.track.price,
          artist: like.track.artist,
          liked_at: like.created_at,
        }));
    },
    enabled: !!user,
  });
}
