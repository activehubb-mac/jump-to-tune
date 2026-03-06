import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SingModeTrack {
  track_id: string;
  instrumental_url: string;
  lyrics: string | null;
  sing_mode_enabled: boolean;
}

interface SingModeVideo {
  id: string;
  user_id: string;
  track_id: string;
  video_url: string | null;
  caption_text: string | null;
  status: string;
  is_featured: boolean;
  is_moderated: boolean;
  created_at: string;
}

export function useSingModeTrack(trackId: string | undefined) {
  return useQuery<SingModeTrack | null>({
    queryKey: ["sing-mode-track", trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data, error } = await supabase
        .from("track_karaoke")
        .select("track_id, instrumental_url, lyrics, sing_mode_enabled")
        .eq("track_id", trackId)
        .eq("sing_mode_enabled", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!trackId,
  });
}

export function useSingModeVideos(trackId?: string) {
  const { user } = useAuth();

  return useQuery<SingModeVideo[]>({
    queryKey: ["sing-mode-videos", user?.id, trackId],
    queryFn: async () => {
      let query = supabase
        .from("sing_mode_videos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (trackId) {
        query = query.eq("track_id", trackId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useFeaturedSingVideos() {
  return useQuery<SingModeVideo[]>({
    queryKey: ["sing-mode-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sing_mode_videos")
        .select("*")
        .eq("is_featured", true)
        .eq("is_moderated", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveSingVideo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      videoBlob,
      caption,
    }: {
      trackId: string;
      videoBlob: Blob;
      caption?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const path = `${user.id}/${timestamp}_sing.webm`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("go-dj-mix-renders")
        .upload(path, videoBlob, {
          contentType: "video/webm",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("go-dj-mix-renders")
        .getPublicUrl(path);

      // Save record
      const { data, error } = await supabase
        .from("sing_mode_videos")
        .insert({
          user_id: user.id,
          track_id: trackId,
          video_url: urlData.publicUrl,
          caption_text: caption || null,
          status: "completed",
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sing-mode-videos"] });
    },
  });
}
