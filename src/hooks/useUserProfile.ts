import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "fan" | "artist" | "label" | null;

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_image_url: string | null;
  bio: string | null;
  website_url: string | null;
  is_verified: boolean | null;
  role: UserRole;
  // Stats
  trackCount: number;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  // Label-specific
  artistCount?: number;
  // Fan-specific
  ownedTrackCount?: number;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      // Get public profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") return null;
        throw profileError;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      const role: UserRole = roleData?.role || "fan";

      // Get follower count
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Get following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      let trackCount = 0;
      let likeCount = 0;
      let artistCount = 0;
      let ownedTrackCount = 0;

      if (role === "artist") {
        // Get track count for artists
        const { count } = await supabase
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("artist_id", userId)
          .eq("is_draft", false);
        trackCount = count || 0;

        // Get total likes on artist's tracks
        const { data: tracks } = await supabase
          .from("tracks")
          .select("id")
          .eq("artist_id", userId);

        const trackIds = tracks?.map((t) => t.id) || [];
        if (trackIds.length > 0) {
          const { count: likes } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .in("track_id", trackIds);
          likeCount = likes || 0;
        }
      } else if (role === "label") {
        // Get track count for labels
        const { count } = await supabase
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("label_id", userId)
          .eq("is_draft", false);
        trackCount = count || 0;

        // Get artist count from roster
        const { count: artists } = await supabase
          .from("label_roster")
          .select("*", { count: "exact", head: true })
          .eq("label_id", userId)
          .eq("status", "active");
        artistCount = artists || 0;
      } else {
        // Fan: get owned track count
        const { count } = await supabase
          .from("purchases")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        ownedTrackCount = count || 0;

        // Get like count for fan
        const { count: likes } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        likeCount = likes || 0;
      }

      return {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        banner_image_url: profile.banner_image_url,
        bio: profile.bio,
        website_url: profile.website_url,
        is_verified: profile.is_verified,
        role,
        trackCount,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        likeCount,
        artistCount,
        ownedTrackCount,
      };
    },
    enabled: !!userId,
  });
}
