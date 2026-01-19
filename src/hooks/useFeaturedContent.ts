import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FeaturedContentType = "artist" | "label" | "track" | "album";

export interface FeaturedContent {
  id: string;
  content_type: FeaturedContentType;
  content_id: string;
  display_location: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeaturedContentWithDetails extends FeaturedContent {
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean | null;
  };
}

export function useFeaturedContent(
  contentType?: FeaturedContentType,
  displayLocation?: string
) {
  return useQuery({
    queryKey: ["featured-content", contentType, displayLocation],
    queryFn: async () => {
      let query = supabase
        .from("featured_content")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (contentType) {
        query = query.eq("content_type", contentType);
      }
      if (displayLocation) {
        query = query.eq("display_location", displayLocation);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeaturedContent[];
    },
  });
}

export function useFeaturedContentAdmin(contentType?: FeaturedContentType) {
  return useQuery({
    queryKey: ["featured-content-admin", contentType],
    queryFn: async () => {
      let query = supabase
        .from("featured_content")
        .select("*")
        .order("priority", { ascending: true });

      if (contentType) {
        query = query.eq("content_type", contentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeaturedContent[];
    },
  });
}

export function useFeaturedArtists(displayLocation = "artists_page") {
  return useQuery({
    queryKey: ["featured-artists", displayLocation],
    queryFn: async () => {
      // Get featured content entries
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "artist")
        .eq("display_location", displayLocation)
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .order("priority", { ascending: true });

      if (featuredError) throw featuredError;
      if (!featuredData || featuredData.length === 0) return [];

      // Get profile details for featured artists
      const contentIds = featuredData.map((f) => f.content_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url, bio, is_verified")
        .in("id", contentIds);

      if (profilesError) throw profilesError;

      // Merge and sort by priority
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      return featuredData
        .map((f) => ({
          ...f,
          profile: profileMap.get(f.content_id),
        }))
        .filter((f) => f.profile) as FeaturedContentWithDetails[];
    },
  });
}

export function useFeaturedLabels(displayLocation = "labels_page") {
  return useQuery({
    queryKey: ["featured-labels", displayLocation],
    queryFn: async () => {
      // Get featured content entries
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "label")
        .eq("display_location", displayLocation)
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .order("priority", { ascending: true });

      if (featuredError) throw featuredError;
      if (!featuredData || featuredData.length === 0) return [];

      // Get profile details for featured labels
      const contentIds = featuredData.map((f) => f.content_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url, bio, is_verified")
        .in("id", contentIds);

      if (profilesError) throw profilesError;

      // Merge and sort by priority
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      return featuredData
        .map((f) => ({
          ...f,
          profile: profileMap.get(f.content_id),
        }))
        .filter((f) => f.profile) as FeaturedContentWithDetails[];
    },
  });
}

export interface FeaturedTrackWithDetails extends FeaturedContent {
  track?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string;
    price: number;
    has_karaoke: boolean | null;
    duration: number | null;
    artist_id: string;
    artist_name: string | null;
  };
}

export function useFeaturedTracks(displayLocation = "home_hero") {
  return useQuery({
    queryKey: ["featured-tracks", displayLocation],
    queryFn: async () => {
      // Get featured content entries for tracks
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "track")
        .eq("display_location", displayLocation)
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .order("priority", { ascending: true });

      if (featuredError) throw featuredError;
      if (!featuredData || featuredData.length === 0) return [];

      // Get track details
      const contentIds = featuredData.map((f) => f.content_id);
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("id, title, cover_art_url, audio_url, price, has_karaoke, duration, artist_id")
        .in("id", contentIds)
        .eq("is_draft", false);

      if (tracksError) throw tracksError;
      if (!tracks || tracks.length === 0) return [];

      // Get artist names
      const artistIds = [...new Set(tracks.map((t) => t.artist_id))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a.display_name]));

      // Merge and sort by priority
      const trackMap = new Map(
        tracks.map((t) => [
          t.id,
          { ...t, artist_name: artistMap.get(t.artist_id) || null },
        ])
      );
      return featuredData
        .map((f) => ({
          ...f,
          track: trackMap.get(f.content_id),
        }))
        .filter((f) => f.track) as FeaturedTrackWithDetails[];
    },
  });
}

export interface FeaturedAlbumWithDetails extends FeaturedContent {
  album?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    release_type: string;
    total_price: number | null;
    artist_id: string;
    artist_name: string | null;
  };
}

export function useFeaturedAlbums(displayLocation = "browse_page") {
  return useQuery({
    queryKey: ["featured-albums", displayLocation],
    queryFn: async () => {
      // Get featured content entries for albums
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "album")
        .eq("display_location", displayLocation)
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .order("priority", { ascending: true });

      if (featuredError) throw featuredError;
      if (!featuredData || featuredData.length === 0) return [];

      // Get album details
      const contentIds = featuredData.map((f) => f.content_id);
      const { data: albums, error: albumsError } = await supabase
        .from("albums")
        .select("id, title, cover_art_url, release_type, total_price, artist_id")
        .in("id", contentIds)
        .eq("is_draft", false);

      if (albumsError) throw albumsError;
      if (!albums || albums.length === 0) return [];

      // Get artist names
      const artistIds = [...new Set(albums.map((a) => a.artist_id))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a.display_name]));

      // Merge and sort by priority
      const albumMap = new Map(
        albums.map((a) => [
          a.id,
          { ...a, artist_name: artistMap.get(a.artist_id) || null },
        ])
      );
      return featuredData
        .map((f) => ({
          ...f,
          album: albumMap.get(f.content_id),
        }))
        .filter((f) => f.album) as FeaturedAlbumWithDetails[];
    },
  });
}

export function useAddFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content_type: FeaturedContentType;
      content_id: string;
      display_location: string;
      priority?: number;
      starts_at?: string;
      ends_at?: string | null;
      is_active?: boolean;
      created_by: string;
    }) => {
      const { error } = await supabase.from("featured_content").insert({
        content_type: data.content_type,
        content_id: data.content_id,
        display_location: data.display_location,
        priority: data.priority ?? 1,
        starts_at: data.starts_at ?? new Date().toISOString(),
        ends_at: data.ends_at,
        is_active: data.is_active ?? true,
        created_by: data.created_by,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-content"] });
      queryClient.invalidateQueries({ queryKey: ["featured-content-admin"] });
      queryClient.invalidateQueries({ queryKey: ["featured-artists"] });
      queryClient.invalidateQueries({ queryKey: ["featured-labels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["featured-albums"] });
    },
  });
}

export function useUpdateFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<FeaturedContent> & { id: string }) => {
      const { error } = await supabase
        .from("featured_content")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-content"] });
      queryClient.invalidateQueries({ queryKey: ["featured-content-admin"] });
      queryClient.invalidateQueries({ queryKey: ["featured-artists"] });
      queryClient.invalidateQueries({ queryKey: ["featured-labels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["featured-albums"] });
    },
  });
}

export function useRemoveFeaturedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_content")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-content"] });
      queryClient.invalidateQueries({ queryKey: ["featured-content-admin"] });
      queryClient.invalidateQueries({ queryKey: ["featured-artists"] });
      queryClient.invalidateQueries({ queryKey: ["featured-labels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["featured-albums"] });
    },
  });
}
