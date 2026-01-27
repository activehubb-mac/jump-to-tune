import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtists } from "@/hooks/useArtists";
import { useLabels } from "@/hooks/useLabels";

interface Track {
  id: string;
  title: string;
  cover_art_url: string | null;
  price: number;
  artist_id: string;
  artist_name: string | null;
}

interface Album {
  id: string;
  title: string;
  cover_art_url: string | null;
  release_type: string;
  artist_id: string;
  artist_name: string | null;
}

interface Artist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  trackCount: number;
  followerCount: number;
}

interface Label {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  artistCount: number;
  trackCount: number;
}

export interface BrowseSearchResults {
  tracks: Track[];
  artists: Artist[];
  labels: Label[];
  albums: Album[];
  isLoading: boolean;
  hasResults: boolean;
}

export function useBrowseSearch(searchQuery: string) {
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length >= 2;

  // Search artists
  const { data: artistResults = [], isLoading: artistsLoading } = useArtists({
    searchQuery: isSearching ? trimmedQuery : undefined,
    limit: 10,
  });

  // Search labels
  const { data: labelResults = [], isLoading: labelsLoading } = useLabels({
    searchQuery: isSearching ? trimmedQuery : undefined,
    limit: 10,
  });

  // Search albums
  const { data: albumResults = [], isLoading: albumsLoading } = useQuery({
    queryKey: ["browse-search-albums", trimmedQuery],
    queryFn: async (): Promise<Album[]> => {
      if (!isSearching) return [];

      const { data: albums, error } = await supabase
        .from("albums")
        .select("id, title, cover_art_url, release_type, artist_id")
        .eq("is_draft", false)
        .ilike("title", `%${trimmedQuery}%`)
        .limit(10);

      if (error) throw error;
      if (!albums || albums.length === 0) return [];

      // Fetch artist names
      const artistIds = [...new Set(albums.map((a) => a.artist_id).filter(Boolean))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a.display_name]) || []);

      return albums.map((album) => ({
        ...album,
        artist_name: artistMap.get(album.artist_id) || null,
      }));
    },
    enabled: isSearching,
  });

  // Search tracks
  const { data: trackResults = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["browse-search-tracks", trimmedQuery],
    queryFn: async (): Promise<Track[]> => {
      if (!isSearching) return [];

      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id, title, cover_art_url, price, artist_id")
        .eq("is_draft", false)
        .ilike("title", `%${trimmedQuery}%`)
        .limit(20);

      if (error) throw error;
      if (!tracks || tracks.length === 0) return [];

      // Fetch artist names
      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a.display_name]) || []);

      return tracks.map((track) => ({
        ...track,
        artist_name: artistMap.get(track.artist_id) || null,
      }));
    },
    enabled: isSearching,
  });

  const isLoading = artistsLoading || labelsLoading || albumsLoading || tracksLoading;

  const hasResults = useMemo(() => {
    if (!isSearching) return false;
    return (
      artistResults.length > 0 ||
      labelResults.length > 0 ||
      albumResults.length > 0 ||
      trackResults.length > 0
    );
  }, [isSearching, artistResults, labelResults, albumResults, trackResults]);

  return {
    tracks: isSearching ? trackResults : [],
    artists: isSearching ? artistResults : [],
    labels: isSearching ? labelResults : [],
    albums: isSearching ? albumResults : [],
    isLoading: isSearching && isLoading,
    hasResults,
  };
}
