import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  role: "editor" | "viewer";
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  user?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function usePlaylistCollaborators(playlistId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: collaborators, isLoading, error } = useQuery({
    queryKey: ["playlist-collaborators", playlistId],
    queryFn: async () => {
      if (!playlistId) return [];

      const { data, error } = await supabase
        .from("playlist_collaborators")
        .select("*")
        .eq("playlist_id", playlistId);

      if (error) throw error;

      // Fetch user profiles for each collaborator
      const collaboratorsWithProfiles = await Promise.all(
        (data || []).map(async (collab) => {
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("id, display_name, avatar_url")
            .eq("id", collab.user_id)
            .maybeSingle();

          return {
            ...collab,
            user: profile || undefined,
          };
        })
      );

      return collaboratorsWithProfiles as PlaylistCollaborator[];
    },
    enabled: !!playlistId,
  });

  const inviteCollaborator = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "editor" | "viewer" }) => {
      if (!user || !playlistId) throw new Error("Not authenticated or no playlist selected");

      // Find user by email - we need to look up user somehow
      // For now, we'll use a simple approach - in real app you'd have a user search
      const { data: profiles, error: searchError } = await supabase
        .from("profiles_public")
        .select("id")
        .limit(1);

      if (searchError) throw searchError;
      
      // This is a placeholder - in real implementation, you'd search by email
      // via an edge function or auth API
      throw new Error("User search by email requires edge function implementation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-collaborators", playlistId] });
    },
  });

  const inviteByUserId = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "editor" | "viewer" }) => {
      if (!user || !playlistId) throw new Error("Not authenticated or no playlist selected");

      const { data, error } = await supabase
        .from("playlist_collaborators")
        .insert({
          playlist_id: playlistId,
          user_id: userId,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-collaborators", playlistId] });
    },
  });

  const acceptInvite = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("playlist_collaborators")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", collaboratorId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-collaborators", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["playlist-invites", user?.id] });
    },
  });

  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("playlist_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-collaborators", playlistId] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ collaboratorId, role }: { collaboratorId: string; role: "editor" | "viewer" }) => {
      const { error } = await supabase
        .from("playlist_collaborators")
        .update({ role })
        .eq("id", collaboratorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-collaborators", playlistId] });
    },
  });

  return {
    collaborators: collaborators || [],
    isLoading,
    error,
    inviteByUserId,
    acceptInvite,
    removeCollaborator,
    updateRole,
  };
}

// Hook to get pending playlist invites for the current user
export function usePlaylistInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invites, isLoading, error } = useQuery({
    queryKey: ["playlist-invites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("playlist_collaborators")
        .select("*")
        .eq("user_id", user.id)
        .is("accepted_at", null);

      if (error) throw error;

      // Fetch playlist and inviter info for each invite
      const invitesWithDetails = await Promise.all(
        (data || []).map(async (invite) => {
          const [playlistResult, inviterResult] = await Promise.all([
            supabase.from("playlists").select("id, name, cover_image_url").eq("id", invite.playlist_id).maybeSingle(),
            supabase.from("profiles_public").select("id, display_name, avatar_url").eq("id", invite.invited_by).maybeSingle(),
          ]);

          return {
            ...invite,
            playlist: playlistResult.data,
            inviter: inviterResult.data,
          };
        })
      );

      return invitesWithDetails;
    },
    enabled: !!user,
  });

  const declineInvite = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("playlist_collaborators")
        .delete()
        .eq("id", collaboratorId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-invites", user?.id] });
    },
  });

  return {
    invites: invites || [],
    isLoading,
    error,
    declineInvite,
  };
}
