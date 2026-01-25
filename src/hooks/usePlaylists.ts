import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  is_collaborative: boolean;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  track_count?: number;
  cover_tracks?: {
    id: string;
    cover_art_url: string | null;
  }[];
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  track: {
    id: string;
    title: string;
    audio_url: string;
    cover_art_url: string | null;
    duration: number | null;
    price: number;
    artist: {
      id: string;
      display_name: string | null;
    } | null;
  } | null;
}

export function usePlaylists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (playlistsError) throw playlistsError;

      // Fetch track counts and first 4 cover arts for each playlist
      const playlistsWithDetails = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          // Get track count
          const { count } = await supabase
            .from("playlist_tracks")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          // Get first 4 tracks for mosaic cover
          const { data: coverTracks } = await supabase
            .from("playlist_tracks")
            .select("track_id, tracks(id, cover_art_url)")
            .eq("playlist_id", playlist.id)
            .order("position", { ascending: true })
            .limit(4);

          return {
            ...playlist,
            track_count: count || 0,
            cover_tracks: coverTracks?.map((pt: any) => ({
              id: pt.tracks?.id,
              cover_art_url: pt.tracks?.cover_art_url,
            })) || [],
          };
        })
      );

      return playlistsWithDetails as Playlist[];
    },
    enabled: !!user,
  });

  const createPlaylist = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  const updatePlaylist = useMutation({
    mutationFn: async ({ id, name, description, cover_image_url }: { 
      id: string; 
      name?: string; 
      description?: string;
      cover_image_url?: string | null;
    }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url;

      const { data, error } = await supabase
        .from("playlists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  const deletePlaylist = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  return {
    playlists: playlists || [],
    isLoading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  };
}

export function usePlaylistTracks(playlistId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ["playlist-tracks", playlistId],
    queryFn: async () => {
      if (!playlistId) return [];

      const { data, error } = await supabase
        .from("playlist_tracks")
        .select(`
          id,
          playlist_id,
          track_id,
          position,
          added_at,
          tracks (
            id,
            title,
            audio_url,
            cover_art_url,
            duration,
            price,
            artist_id
          )
        `)
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (error) throw error;

      // Fetch artist info for each track
      const tracksWithArtists = await Promise.all(
        (data || []).map(async (pt: any) => {
          if (!pt.tracks?.artist_id) {
            return {
              ...pt,
              track: { ...pt.tracks, artist: null },
            };
          }

          const { data: profile } = await supabase
            .from("profiles_public")
            .select("id, display_name")
            .eq("id", pt.tracks.artist_id)
            .single();

          return {
            id: pt.id,
            playlist_id: pt.playlist_id,
            track_id: pt.track_id,
            position: pt.position,
            added_at: pt.added_at,
            track: {
              id: pt.tracks.id,
              title: pt.tracks.title,
              audio_url: pt.tracks.audio_url,
              cover_art_url: pt.tracks.cover_art_url,
              duration: pt.tracks.duration,
              price: pt.tracks.price,
              artist: profile || null,
            },
          };
        })
      );

      return tracksWithArtists as PlaylistTrack[];
    },
    enabled: !!playlistId,
  });

  const addTrack = useMutation({
    mutationFn: async ({ trackId }: { trackId: string }) => {
      if (!playlistId) throw new Error("No playlist selected");

      // Get highest position
      const { data: existing } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { error } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: nextPosition,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  const removeTrack = useMutation({
    mutationFn: async ({ trackId }: { trackId: string }) => {
      if (!playlistId) throw new Error("No playlist selected");

      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("track_id", trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
    },
  });

  const reorderTracks = useMutation({
    mutationFn: async (trackIds: string[]) => {
      if (!playlistId) throw new Error("No playlist selected");

      // Update positions for each track
      const updates = trackIds.map((trackId, index) =>
        supabase
          .from("playlist_tracks")
          .update({ position: index })
          .eq("playlist_id", playlistId)
          .eq("track_id", trackId)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
    },
  });

  return {
    tracks: tracks || [],
    isLoading,
    error,
    addTrack,
    removeTrack,
    reorderTracks,
  };
}
