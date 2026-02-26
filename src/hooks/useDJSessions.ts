import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DJSession {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: string;
  session_type: string;
  gating: string;
  max_seats: number | null;
  sort_mode: string;
  pinned_track_ids: string[];
  submissions_enabled: boolean;
  submission_price_cents: number;
  weekly_submission_cap: number | null;
  submission_guidelines: string | null;
  refund_policy: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDJSessions(artistId?: string) {
  return useQuery({
    queryKey: ["dj-sessions", artistId],
    queryFn: async () => {
      let query = supabase
        .from("dj_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (artistId) {
        query = query.eq("artist_id", artistId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DJSession[];
    },
    enabled: true,
  });
}

export function useDJSessionsByStatus(status: string, limit?: number) {
  return useQuery({
    queryKey: ["dj-sessions-status", status, limit],
    queryFn: async () => {
      let query = supabase
        .from("dj_sessions")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DJSession[];
    },
  });
}

export function useCreateDJSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (session: {
      title: string;
      description?: string;
      cover_image_url?: string;
      gating?: string;
      scheduled_at?: string;
      session_type?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase
        .from("dj_sessions")
        .insert({
          artist_id: user.id,
          title: session.title,
          description: session.description || null,
          cover_image_url: session.cover_image_url || null,
          gating: session.gating || "public",
          status: session.scheduled_at ? "scheduled" : "active",
          scheduled_at: session.scheduled_at || null,
          session_type: session.session_type || "jumtunes",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-sessions"] });
    },
  });
}

export function useDJSessionDetail(sessionId?: string) {
  return useQuery({
    queryKey: ["dj-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();

      if (error) throw error;
      return data as DJSession;
    },
    enabled: !!sessionId,
  });
}

export function useUpdateDJSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string | null;
      cover_image_url?: string | null;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("dj_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dj-session"] });
    },
  });
}

export function useDeleteDJSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("dj_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dj-sessions"] });
    },
  });
}
