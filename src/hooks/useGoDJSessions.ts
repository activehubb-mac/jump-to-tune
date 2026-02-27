import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GoDJSession {
  id: string;
  dj_user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  visibility: string;
  mode: string;
  status: string;
  mix_audio_url: string | null;
  duration_sec: number | null;
  created_at: string;
  updated_at: string;
}

export function useGoDJSessions(userId?: string) {
  return useQuery({
    queryKey: ["go-dj-sessions", userId],
    queryFn: async () => {
      let query = supabase
        .from("go_dj_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("dj_user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GoDJSession[];
    },
  });
}

export function usePublishedGoDJSessions(limit?: number) {
  return useQuery({
    queryKey: ["go-dj-sessions-published", limit],
    queryFn: async () => {
      let query = supabase
        .from("go_dj_sessions")
        .select("*")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GoDJSession[];
    },
  });
}

export function useGoDJSessionDetail(sessionId?: string) {
  return useQuery({
    queryKey: ["go-dj-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("go_dj_sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data as GoDJSession;
    },
    enabled: !!sessionId,
  });
}

export function useCreateGoDJSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: {
      title: string;
      description?: string;
      cover_url?: string;
      visibility?: string;
      mode?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase
        .from("go_dj_sessions")
        .insert({
          dj_user_id: user.id,
          title: session.title,
          description: session.description || null,
          cover_url: session.cover_url || null,
          visibility: session.visibility || "public",
          mode: session.mode || "standard",
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data as GoDJSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-sessions"] });
    },
  });
}

export function useUpdateGoDJSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string | null;
      cover_url?: string | null;
      visibility?: string;
      mode?: string;
      status?: string;
      mix_audio_url?: string | null;
      duration_sec?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("go_dj_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as GoDJSession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["go-dj-session", variables.id] });
    },
  });
}

export function useDeleteGoDJSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("go_dj_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-sessions"] });
    },
  });
}

export function usePublishGoDJSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Mock render: go straight to published
      const { data, error } = await supabase
        .from("go_dj_sessions")
        .update({ status: "published" })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data as GoDJSession;
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["go-dj-session", sessionId] });
    },
  });
}
