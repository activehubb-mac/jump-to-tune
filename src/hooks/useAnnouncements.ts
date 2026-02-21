import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export interface Announcement {
  id: string;
  artist_id: string;
  title: string;
  body: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_highlighted: boolean;
  audience_filter: Record<string, unknown> | null;
  created_at: string;
}

interface CreateAnnouncementData {
  title: string;
  body: string;
  image_url?: string;
  cta_label?: string;
  cta_url?: string;
  is_highlighted?: boolean;
  audience_filter?: Record<string, unknown>;
}

export function useAnnouncements(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!artistId,
  });

  const createAnnouncement = useMutation({
    mutationFn: async (input: CreateAnnouncementData) => {
      // Client-side rate limit: max 3 per 24h
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", user!.id)
        .gte("created_at", dayAgo);

      if ((count ?? 0) >= 3) {
        throw new Error("You can only post 3 announcements per 24 hours.");
      }

      const { data, error } = await supabase
        .from("announcements")
        .insert({ ...input, artist_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      showFeedback({ type: "success", title: "Announcement Posted", message: "Your announcement is live." });
    },
    onError: (err) => {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to post announcement" });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  return { announcements, isLoading, createAnnouncement, deleteAnnouncement };
}
