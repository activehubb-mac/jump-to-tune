import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  trackCount: number;
  followerCount: number;
}

export function useArtists(options: { limit?: number; searchQuery?: string } = {}) {
  const { limit, searchQuery } = options;

  return useQuery({
    queryKey: ["artists", options],
    queryFn: async (): Promise<Artist[]> => {
      // Get all users with artist role
      const { data: artistRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "artist");

      if (rolesError) throw rolesError;
      
      const artistIds = artistRoles?.map((r) => r.user_id) || [];
      
      if (artistIds.length === 0) return [];

      // Get public profiles for these artists (excludes sensitive Stripe fields)
      let profilesQuery = supabase
        .from("profiles_public")
        .select("*")
        .in("id", artistIds);

      if (searchQuery) {
        profilesQuery = profilesQuery.ilike("display_name", `%${searchQuery}%`);
      }

      if (limit) {
        profilesQuery = profilesQuery.limit(limit);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      // Get track counts and follower counts for each artist
      const artistsWithStats: Artist[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get track count
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("artist_id", profile.id)
            .eq("is_draft", false);

          // Get follower count
          const { count: followerCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profile.id);

          return {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_verified: profile.is_verified,
            trackCount: trackCount || 0,
            followerCount: followerCount || 0,
          };
        })
      );

      return artistsWithStats;
    },
  });
}

export function useFeaturedArtists(limit: number = 3) {
  return useArtists({ limit });
}
