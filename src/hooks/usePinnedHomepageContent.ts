import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HomepageDisplayLocation = "home_new_releases" | "home_trending" | "home_discover_artists";

interface PinnedContent {
  id: string;
  content_type: string;
  content_id: string;
  display_location: string;
  priority: number;
}

export function usePinnedHomepageContent(location: HomepageDisplayLocation) {
  return useQuery({
    queryKey: ["pinned-homepage-content", location],
    queryFn: async (): Promise<PinnedContent[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("featured_content")
        .select("id, content_type, content_id, display_location, priority")
        .eq("display_location", location)
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("priority", { ascending: true });

      if (error) throw error;
      return (data || []) as PinnedContent[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
