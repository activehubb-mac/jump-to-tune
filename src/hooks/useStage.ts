import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type StageMode = "sing" | "duet" | "dance";

export interface StageTrack {
  track_id: string;
  instrumental_url: string;
  lyrics: string | null;
  stage_enabled: boolean;
  sing_mode_enabled: boolean;
  duet_mode_enabled: boolean;
  dance_mode_enabled: boolean;
}

export interface StageVideo {
  id: string;
  user_id: string;
  track_id: string;
  mode: StageMode;
  video_url: string | null;
  thumbnail_url: string | null;
  caption_text: string | null;
  template: string;
  status: string;
  is_featured: boolean;
  is_moderated: boolean;
  created_at: string;
}

/** Fetch stage-enabled track data */
export function useStageTrack(trackId: string | undefined) {
  return useQuery<StageTrack | null>({
    queryKey: ["stage-track", trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data, error } = await supabase
        .from("track_karaoke")
        .select("track_id, instrumental_url, lyrics, stage_enabled, sing_mode_enabled, duet_mode_enabled, dance_mode_enabled")
        .eq("track_id", trackId)
        .eq("stage_enabled", true)
        .maybeSingle();
      if (error) throw error;
      return data as StageTrack | null;
    },
    enabled: !!trackId,
  });
}

/** Get available modes for a stage track */
export function getAvailableModes(track: StageTrack | null | undefined): StageMode[] {
  if (!track) return [];
  const modes: StageMode[] = [];
  if (track.sing_mode_enabled && (track.instrumental_url || track.lyrics)) modes.push("sing");
  if (track.duet_mode_enabled) modes.push("duet");
  if (track.dance_mode_enabled) modes.push("dance");
  return modes;
}

/** Fetch user's stage videos */
export function useStageVideos(trackId?: string) {
  const { user } = useAuth();
  return useQuery<StageVideo[]>({
    queryKey: ["stage-videos", user?.id, trackId],
    queryFn: async () => {
      let query = supabase
        .from("stage_videos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (trackId) query = query.eq("track_id", trackId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StageVideo[];
    },
    enabled: !!user,
  });
}

/** Fetch featured stage videos */
export function useFeaturedStageVideos() {
  return useQuery<StageVideo[]>({
    queryKey: ["stage-videos-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_videos")
        .select("*")
        .eq("is_featured", true)
        .eq("is_moderated", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as StageVideo[];
    },
  });
}

/** Save a stage video */
export function useSaveStageVideo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      mode,
      videoBlob,
      caption,
      template,
    }: {
      trackId: string;
      mode: StageMode;
      videoBlob: Blob;
      caption?: string;
      template?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const ext = videoBlob.type.startsWith("video/") ? "webm" : "webm";
      const path = `${user.id}/${timestamp}_stage_${mode}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("go-dj-mix-renders")
        .upload(path, videoBlob, { contentType: videoBlob.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("go-dj-mix-renders")
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from("stage_videos")
        .insert({
          user_id: user.id,
          track_id: trackId,
          mode,
          video_url: urlData.publicUrl,
          caption_text: caption || null,
          template: template || "spotlight",
          status: "completed",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-videos"] });
    },
  });
}
