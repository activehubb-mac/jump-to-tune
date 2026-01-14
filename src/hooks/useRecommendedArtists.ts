import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecommendedArtist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  matchingGenres: string[];
  trackCount: number;
  followerCount: number;
}

export function useRecommendedArtists(limit: number = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendedArtists", user?.id, limit],
    queryFn: async (): Promise<RecommendedArtist[]> => {
      if (!user) return [];

      // Step 1: Get artists the user follows
      const { data: followedArtists, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;
      
      const followedIds = followedArtists?.map((f) => f.following_id) || [];
      
      if (followedIds.length === 0) {
        // User doesn't follow anyone, return popular artists instead
        return getPopularArtists(user.id, limit);
      }

      // Step 2: Get genres of followed artists
      const { data: followedGenres, error: genresError } = await supabase
        .from("profile_genres")
        .select("genre")
        .in("profile_id", followedIds);

      if (genresError) throw genresError;

      const genres = [...new Set(followedGenres?.map((g) => g.genre) || [])];
      
      if (genres.length === 0) {
        // Followed artists have no genres, return popular artists
        return getPopularArtists(user.id, limit);
      }

      // Step 3: Find artists with matching genres (excluding followed artists and self)
      const { data: matchingProfiles, error: matchingError } = await supabase
        .from("profile_genres")
        .select(`
          genre,
          profile:profiles!inner (
            id,
            display_name,
            avatar_url,
            bio
          )
        `)
        .in("genre", genres)
        .not("profile_id", "in", `(${[...followedIds, user.id].join(",")})`);

      if (matchingError) throw matchingError;

      // Step 4: Check which profiles are artists
      const { data: artistRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "artist");

      if (rolesError) throw rolesError;
      
      const artistIds = new Set(artistRoles?.map((r) => r.user_id) || []);

      // Group by profile and count matching genres
      const profileMap = new Map<string, { profile: any; genres: Set<string> }>();
      
      matchingProfiles?.forEach((item: any) => {
        if (!item.profile || !artistIds.has(item.profile.id)) return;
        
        const profileId = item.profile.id;
        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, { profile: item.profile, genres: new Set() });
        }
        profileMap.get(profileId)!.genres.add(item.genre);
      });

      // Convert to array and sort by number of matching genres
      const candidates = Array.from(profileMap.entries())
        .map(([_, { profile, genres }]) => ({
          profile,
          matchingGenres: Array.from(genres),
          matchCount: genres.size,
        }))
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, limit);

      // Step 5: Get track counts and follower counts
      const recommendations: RecommendedArtist[] = await Promise.all(
        candidates.map(async ({ profile, matchingGenres }) => {
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("artist_id", profile.id)
            .eq("is_draft", false);

          const { count: followerCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profile.id);

          return {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            matchingGenres,
            trackCount: trackCount || 0,
            followerCount: followerCount || 0,
          };
        })
      );

      // If not enough recommendations, fill with popular artists
      if (recommendations.length < limit) {
        const popularArtists = await getPopularArtists(
          user.id,
          limit - recommendations.length,
          [...followedIds, ...recommendations.map((r) => r.id)]
        );
        return [...recommendations, ...popularArtists];
      }

      return recommendations;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

async function getPopularArtists(
  userId: string,
  limit: number,
  excludeIds: string[] = []
): Promise<RecommendedArtist[]> {
  // Get all artists
  const { data: artistRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "artist");

  if (rolesError) throw rolesError;

  const artistIds = artistRoles?.map((r) => r.user_id) || [];
  const filteredIds = artistIds.filter((id) => id !== userId && !excludeIds.includes(id));

  if (filteredIds.length === 0) return [];

  // Get profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .in("id", filteredIds.slice(0, limit * 2)); // Get extra in case some have no tracks

  if (profilesError) throw profilesError;

  // Get stats and filter to those with tracks
  const artistsWithStats: RecommendedArtist[] = [];
  
  for (const profile of profiles || []) {
    if (artistsWithStats.length >= limit) break;

    const { count: trackCount } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", profile.id)
      .eq("is_draft", false);

    if (trackCount && trackCount > 0) {
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);

      artistsWithStats.push({
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        matchingGenres: [],
        trackCount: trackCount || 0,
        followerCount: followerCount || 0,
      });
    }
  }

  // Sort by follower count
  return artistsWithStats.sort((a, b) => b.followerCount - a.followerCount);
}
