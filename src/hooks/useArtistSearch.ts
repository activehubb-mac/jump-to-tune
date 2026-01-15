import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchedArtist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useArtistSearch(searchQuery: string, excludeIds: string[] = []) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return useQuery({
    queryKey: ["artist-search", debouncedQuery, excludeIds],
    queryFn: async (): Promise<SearchedArtist[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      // Get all users with artist role
      const { data: artistRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "artist");

      if (!artistRoles || artistRoles.length === 0) return [];

      const artistIds = artistRoles
        .map((r) => r.user_id)
        .filter((id) => !excludeIds.includes(id));

      if (artistIds.length === 0) return [];

      // Search profiles by display name
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", artistIds)
        .ilike("display_name", `%${debouncedQuery}%`)
        .limit(10);

      return profiles ?? [];
    },
    enabled: debouncedQuery.length >= 2,
  });
}
