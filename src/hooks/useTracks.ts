import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedArtist {
  id: string;
  display_name: string | null;
}

interface Track {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  moods: string[] | null;
  is_explicit: boolean | null;
  price: number;
  total_editions: number;
  editions_sold: number;
  cover_art_url: string | null;
  audio_url: string;
  duration: number | null;
  has_karaoke: boolean | null;
  is_draft: boolean | null;
  created_at: string;
  artist_id: string;
  label_id: string | null;
  artist?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  featuredArtists?: FeaturedArtist[];
}

type SortOption = "newest" | "oldest" | "popular" | "price_low" | "price_high";

interface UseTracksOptions {
  artistId?: string;
  labelId?: string;
  publishedOnly?: boolean;
  genre?: string;
  mood?: string;
  limit?: number;
  searchQuery?: string;
  sortBy?: SortOption;
}

export function useTracks(options: UseTracksOptions = {}) {
  const { artistId, labelId, publishedOnly = false, genre, mood, limit, searchQuery, sortBy = "newest" } = options;

  return useQuery({
    queryKey: ["tracks", options],
    queryFn: async (): Promise<Track[]> => {
      // Step 1: Fetch tracks without profile join (RLS blocks profiles for other users)
      let query = supabase
        .from("tracks")
        .select("*");

      // Apply sorting
      switch (sortBy) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "popular":
          query = query.order("editions_sold", { ascending: false });
          break;
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      if (artistId) {
        query = query.eq("artist_id", artistId);
      }

      if (labelId) {
        query = query.eq("label_id", labelId);
      }

      if (publishedOnly) {
        query = query.eq("is_draft", false);
      }

      if (genre && genre !== "All") {
        query = query.eq("genre", genre);
      }

      if (mood && mood !== "All") {
        query = query.contains("moods", [mood]);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: tracks, error } = await query;

      if (error) throw error;
      if (!tracks || tracks.length === 0) return [];

      // Step 2: Get unique artist IDs
      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];
      const trackIds = tracks.map((t) => t.id);

      // Step 3: Fetch artist profiles and track_features in parallel
      const [artistsResult, featuresResult] = await Promise.all([
        supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds),
        supabase
          .from("track_features")
          .select("track_id, artist_id")
          .in("track_id", trackIds),
      ]);

      const artists = artistsResult.data || [];
      const features = featuresResult.data || [];

      // Step 4: Get unique featured artist IDs
      const featuredArtistIds = [...new Set(features.map((f) => f.artist_id))];
      let featuredArtistsMap = new Map<string, { id: string; display_name: string | null }>();
      
      if (featuredArtistIds.length > 0) {
        const { data: featuredProfiles } = await supabase
          .from("profiles_public")
          .select("id, display_name")
          .in("id", featuredArtistIds);
        
        featuredArtistsMap = new Map(featuredProfiles?.map((a) => [a.id!, { id: a.id!, display_name: a.display_name }]) || []);
      }

      // Step 5: Map artists and features to tracks
      const artistMap = new Map(artists.map((a) => [a.id, a]));
      const featuresByTrack = features.reduce((acc, f) => {
        if (!acc[f.track_id]) acc[f.track_id] = [];
        const artist = featuredArtistsMap.get(f.artist_id);
        if (artist) acc[f.track_id].push(artist);
        return acc;
      }, {} as Record<string, FeaturedArtist[]>);
      
      return tracks.map((track) => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null,
        featuredArtists: featuresByTrack[track.id] || [],
      }));
    },
  });
}

export function useArtistTracks(artistId: string | undefined) {
  return useTracks({ artistId, publishedOnly: false });
}

export function useLabelTracks(labelId: string | undefined) {
  return useTracks({ labelId, publishedOnly: false });
}

export function usePublishedTracks(options: Omit<UseTracksOptions, "publishedOnly"> = {}) {
  return useTracks({ ...options, publishedOnly: true });
}

export function useTrendingTracks(limit: number = 6) {
  return useTracks({ publishedOnly: true, limit });
}

// Infinite scroll hook for Browse page
const PAGE_SIZE = 20;

interface UseInfiniteTracksOptions {
  genre?: string;
  mood?: string;
  searchQuery?: string;
  sortBy?: SortOption;
  karaokeOnly?: boolean;
}

export function useInfinitePublishedTracks(options: UseInfiniteTracksOptions = {}) {
  const { genre, mood, searchQuery, sortBy = "newest", karaokeOnly = false } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-tracks", options],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("tracks")
        .select("*")
        .eq("is_draft", false);

      // Apply sorting
      switch (sortBy) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "popular":
          query = query.order("editions_sold", { ascending: false });
          break;
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      if (genre && genre !== "All") {
        query = query.eq("genre", genre);
      }

      if (mood && mood !== "All") {
        query = query.contains("moods", [mood]);
      }

      if (karaokeOnly) {
        query = query.eq("has_karaoke", true);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      // Pagination
      query = query.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data: tracks, error } = await query;

      if (error) throw error;
      if (!tracks || tracks.length === 0) return { tracks: [], nextPage: null };

      // Fetch artist profiles and features
      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];
      const trackIds = tracks.map((t) => t.id);

      const [artistsResult, featuresResult] = await Promise.all([
        supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds),
        supabase
          .from("track_features")
          .select("track_id, artist_id")
          .in("track_id", trackIds),
      ]);

      const artists = artistsResult.data || [];
      const features = featuresResult.data || [];

      const featuredArtistIds = [...new Set(features.map((f) => f.artist_id))];
      let featuredArtistsMap = new Map<string, { id: string; display_name: string | null }>();
      
      if (featuredArtistIds.length > 0) {
        const { data: featuredProfiles } = await supabase
          .from("profiles_public")
          .select("id, display_name")
          .in("id", featuredArtistIds);
        
        featuredArtistsMap = new Map(featuredProfiles?.map((a) => [a.id!, { id: a.id!, display_name: a.display_name }]) || []);
      }

      const artistMap = new Map(artists.map((a) => [a.id, a]));
      const featuresByTrack = features.reduce((acc, f) => {
        if (!acc[f.track_id]) acc[f.track_id] = [];
        const artist = featuredArtistsMap.get(f.artist_id);
        if (artist) acc[f.track_id].push(artist);
        return acc;
      }, {} as Record<string, FeaturedArtist[]>);

      const enrichedTracks = tracks.map((track) => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null,
        featuredArtists: featuresByTrack[track.id] || [],
      }));

      return {
        tracks: enrichedTracks,
        nextPage: tracks.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
