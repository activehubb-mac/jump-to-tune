import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Label {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  artistCount: number;
  trackCount: number;
}

export function useLabels(options: { limit?: number; searchQuery?: string } = {}) {
  const { limit, searchQuery } = options;

  return useQuery({
    queryKey: ["labels", options],
    queryFn: async (): Promise<Label[]> => {
      // Get all users with label role
      const { data: labelRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "label");

      if (rolesError) throw rolesError;
      
      const labelIds = labelRoles?.map((r) => r.user_id) || [];
      
      if (labelIds.length === 0) return [];

      // Get public profiles for these labels (excludes sensitive Stripe fields)
      let profilesQuery = supabase
        .from("profiles_public")
        .select("*")
        .in("id", labelIds);

      if (searchQuery) {
        profilesQuery = profilesQuery.ilike("display_name", `%${searchQuery}%`);
      }

      if (limit) {
        profilesQuery = profilesQuery.limit(limit);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      // Get artist counts and track counts for each label
      const labelsWithStats: Label[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get artist count from roster
          const { count: artistCount } = await supabase
            .from("label_roster")
            .select("*", { count: "exact", head: true })
            .eq("label_id", profile.id)
            .eq("status", "active");

          // Get track count
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("label_id", profile.id)
            .eq("is_draft", false);

          return {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_verified: profile.is_verified,
            artistCount: artistCount || 0,
            trackCount: trackCount || 0,
          };
        })
      );

      return labelsWithStats;
    },
  });
}

export function useFeaturedLabels(limit: number = 2) {
  return useLabels({ limit });
}
