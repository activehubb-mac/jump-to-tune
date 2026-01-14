import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FollowedArtist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followed_at: string;
}

export function useFollowedArtists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followedArtists", user?.id],
    queryFn: async (): Promise<FollowedArtist[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("follows")
        .select(`
          created_at,
          following:profiles!follows_following_id_fkey (
            id,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || [])
        .filter((follow: any) => follow.following)
        .map((follow: any) => ({
          id: follow.following.id,
          display_name: follow.following.display_name,
          avatar_url: follow.following.avatar_url,
          bio: follow.following.bio,
          followed_at: follow.created_at,
        }));
    },
    enabled: !!user,
  });
}

export function useFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user follows a specific profile
  const { data: followingIds = [] } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      return data.map((f) => f.following_id);
    },
    enabled: !!user,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async ({ artistId, artistName }: { artistId: string; artistName?: string }) => {
      if (!user) throw new Error("Must be logged in to follow artists");

      const isCurrentlyFollowing = followingIds.includes(artistId);

      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", artistId);

        if (error) throw error;
        return { action: "unfollowed" as const, artistId, artistName };
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: artistId });

        if (error) throw error;
        return { action: "followed" as const, artistId, artistName };
      }
    },
    onMutate: async ({ artistId }) => {
      await queryClient.cancelQueries({ queryKey: ["following", user?.id] });
      await queryClient.cancelQueries({ queryKey: ["followedArtists", user?.id] });
      await queryClient.cancelQueries({ queryKey: ["followerCounts"] });

      const previousFollowing = queryClient.getQueryData<string[]>(["following", user?.id]);

      queryClient.setQueryData<string[]>(["following", user?.id], (old = []) => {
        if (old.includes(artistId)) {
          return old.filter((id) => id !== artistId);
        }
        return [...old, artistId];
      });

      return { previousFollowing };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFollowing) {
        queryClient.setQueryData(["following", user?.id], context.previousFollowing);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["followedArtists", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["followerCounts"] });
    },
  });

  const isFollowing = (artistId: string) => followingIds.includes(artistId);

  const toggleFollow = (artistId: string, artistName?: string) => {
    return toggleFollowMutation.mutateAsync({ artistId, artistName });
  };

  return {
    followingIds,
    isFollowing,
    toggleFollow,
    isToggling: toggleFollowMutation.isPending,
  };
}
