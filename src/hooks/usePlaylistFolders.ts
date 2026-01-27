import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlaylistFolder {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function usePlaylistFolders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: folders, isLoading, error } = useQuery({
    queryKey: ["playlist-folders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("playlist_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as PlaylistFolder[];
    },
    enabled: !!user,
  });

  const createFolder = useMutation({
    mutationFn: async ({ name, color, icon }: { name: string; color?: string; icon?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("playlist_folders")
        .insert({
          user_id: user.id,
          name,
          color: color || "#8B5CF6",
          icon: icon || "folder",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-folders", user?.id] });
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, name, color, icon }: { id: string; name?: string; color?: string; icon?: string }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;
      if (icon !== undefined) updates.icon = icon;

      const { data, error } = await supabase
        .from("playlist_folders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-folders", user?.id] });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      // First, unset folder_id on all playlists in this folder
      await supabase
        .from("playlists")
        .update({ folder_id: null })
        .eq("folder_id", folderId);

      // Then delete the folder
      const { error } = await supabase
        .from("playlist_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-folders", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  return {
    folders: folders || [],
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
