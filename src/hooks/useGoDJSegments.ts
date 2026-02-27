import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoDJSegment {
  id: string;
  session_id: string;
  segment_type: string;
  order_index: number;
  track_id: string | null;
  voice_clip_id: string | null;
  trim_start_sec: number;
  trim_end_sec: number | null;
  fade_in_sec: number;
  fade_out_sec: number;
  overlay_start_sec: number | null;
  overlay_end_sec: number | null;
  voice_volume: number;
  ducking_enabled: boolean;
  ducking_db: number;
  created_at: string;
}

export function useGoDJSegments(sessionId?: string) {
  return useQuery({
    queryKey: ["go-dj-segments", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("go_dj_segments")
        .select("*")
        .eq("session_id", sessionId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as GoDJSegment[];
    },
    enabled: !!sessionId,
  });
}

export function useAddSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segment: {
      session_id: string;
      segment_type: string;
      order_index: number;
      track_id?: string | null;
      voice_clip_id?: string | null;
      trim_start_sec?: number;
      trim_end_sec?: number | null;
      fade_in_sec?: number;
      fade_out_sec?: number;
    }) => {
      const { data, error } = await supabase
        .from("go_dj_segments")
        .insert({
          session_id: segment.session_id,
          segment_type: segment.segment_type,
          order_index: segment.order_index,
          track_id: segment.track_id || null,
          voice_clip_id: segment.voice_clip_id || null,
          trim_start_sec: segment.trim_start_sec ?? 0,
          trim_end_sec: segment.trim_end_sec ?? null,
          fade_in_sec: segment.fade_in_sec ?? 0,
          fade_out_sec: segment.fade_out_sec ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as GoDJSegment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-segments", data.session_id] });
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      session_id,
      ...updates
    }: {
      id: string;
      session_id: string;
      order_index?: number;
      trim_start_sec?: number;
      trim_end_sec?: number | null;
      fade_in_sec?: number;
      fade_out_sec?: number;
      overlay_start_sec?: number | null;
      overlay_end_sec?: number | null;
      voice_volume?: number;
      ducking_enabled?: boolean;
      ducking_db?: number;
    }) => {
      const { data, error } = await supabase
        .from("go_dj_segments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, session_id } as GoDJSegment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-segments", data.session_id] });
    },
  });
}

export function useRemoveSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, session_id }: { id: string; session_id: string }) => {
      const { error } = await supabase
        .from("go_dj_segments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { session_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-segments", data.session_id] });
    },
  });
}

export function useReorderSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      session_id,
      segments,
    }: {
      session_id: string;
      segments: { id: string; order_index: number }[];
    }) => {
      // Update each segment's order_index
      const promises = segments.map((seg) =>
        supabase
          .from("go_dj_segments")
          .update({ order_index: seg.order_index })
          .eq("id", seg.id)
      );
      const results = await Promise.all(promises);
      const firstError = results.find((r) => r.error);
      if (firstError?.error) throw firstError.error;
      return { session_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-segments", data.session_id] });
    },
  });
}
