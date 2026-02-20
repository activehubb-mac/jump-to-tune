import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityFeedEntry {
  id: string;
  artist_id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useActivityFeed(artistId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-feed", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_feed" as any)
        .select("*")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as unknown) as ActivityFeedEntry[];
    },
    enabled: !!artistId,
  });

  return { entries: data ?? [], isLoading };
}

export function useCreateActivityFeedEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: { type: string; title: string; description?: string; metadata?: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("activity_feed" as any)
        .insert({ artist_id: user!.id, type: entry.type, title: entry.title, description: entry.description || null, metadata: entry.metadata || null } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
    },
  });
}
