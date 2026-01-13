import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArtistProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_image_url: string | null;
  bio: string | null;
  website_url: string | null;
  is_verified: boolean | null;
  trackCount: number;
  followerCount: number;
  likeCount: number;
}

export function useArtistProfile(artistId: string | undefined) {
  return useQuery({
    queryKey: ["artist-profile", artistId],
    queryFn: async (): Promise<ArtistProfile | null> => {
      if (!artistId) return null;

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", artistId)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") return null; // Not found
        throw profileError;
      }

      // Get track count
      const { count: trackCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId)
        .eq("is_draft", false);

      // Get follower count
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", artistId);

      // Get like count (total likes on all artist's tracks)
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", artistId);

      const trackIds = tracks?.map((t) => t.id) || [];
      let likeCount = 0;

      if (trackIds.length > 0) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("track_id", trackIds);
        likeCount = count || 0;
      }

      return {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        banner_image_url: profile.banner_image_url,
        bio: profile.bio,
        website_url: profile.website_url,
        is_verified: profile.is_verified,
        trackCount: trackCount || 0,
        followerCount: followerCount || 0,
        likeCount,
      };
    },
    enabled: !!artistId,
  });
}
