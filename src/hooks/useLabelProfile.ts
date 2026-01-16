import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LabelProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_image_url: string | null;
  bio: string | null;
  website_url: string | null;
  is_verified: boolean | null;
  artistCount: number;
  trackCount: number;
  followerCount: number;
}

export function useLabelProfile(labelId: string | undefined) {
  return useQuery({
    queryKey: ["label-profile", labelId],
    queryFn: async (): Promise<LabelProfile | null> => {
      if (!labelId) return null;

      // Get public profile data (excludes sensitive Stripe fields)
      const { data: profile, error: profileError } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", labelId)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") return null; // Not found
        throw profileError;
      }

      // Get artist count from roster (only active/approved artists)
      const { count: artistCount } = await supabase
        .from("label_roster")
        .select("*", { count: "exact", head: true })
        .eq("label_id", labelId)
        .eq("status", "active");

      // Get track count for this label
      const { count: trackCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("label_id", labelId)
        .eq("is_draft", false);

      // Get follower count
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", labelId);

      return {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        banner_image_url: profile.banner_image_url,
        bio: profile.bio,
        website_url: profile.website_url,
        is_verified: profile.is_verified,
        artistCount: artistCount || 0,
        trackCount: trackCount || 0,
        followerCount: followerCount || 0,
      };
    },
    enabled: !!labelId,
  });
}
