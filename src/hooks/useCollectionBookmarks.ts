import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

interface Bookmark {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
  track?: {
    id: string;
    title: string;
    price: number;
    cover_art_url: string | null;
    audio_url: string;
    artist_id: string;
    genre: string | null;
    duration: number | null;
    editions_sold: number;
    total_editions: number;
    artist?: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export type { Bookmark };

export function useCollectionBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: ["collection-bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("collection_bookmarks")
        .select(`
          *,
          track:tracks(
            id,
            title,
            price,
            cover_art_url,
            audio_url,
            artist_id,
            genre,
            duration,
            editions_sold,
            total_editions,
            artist:profiles!tracks_artist_id_fkey(
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user,
  });

  const addBookmark = useMutation({
    mutationFn: async ({ trackId, hasSubscription }: { trackId: string; hasSubscription: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      if (!hasSubscription) throw new Error("Subscription required to bookmark tracks");

      const { error } = await supabase
        .from("collection_bookmarks")
        .insert({ user_id: user.id, track_id: trackId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-bookmarks", user?.id] });
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("collection_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-bookmarks", user?.id] });
    },
  });

  const isBookmarked = useCallback(
    (trackId: string) => bookmarks.some((b) => b.track_id === trackId),
    [bookmarks]
  );

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark: (trackId: string, hasSubscription: boolean) => 
      addBookmark.mutate({ trackId, hasSubscription }),
    removeBookmark: removeBookmark.mutate,
    isBookmarked,
    isAdding: addBookmark.isPending,
    isRemoving: removeBookmark.isPending,
  };
}
