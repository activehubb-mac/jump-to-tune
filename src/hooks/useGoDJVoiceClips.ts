import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GoDJVoiceClip {
  id: string;
  dj_user_id: string;
  session_id: string | null;
  file_url: string;
  duration_sec: number;
  label: string;
  created_at: string;
}

export function useGoDJVoiceClips(sessionId?: string) {
  return useQuery({
    queryKey: ["go-dj-voice-clips", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("go_dj_voice_clips")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as GoDJVoiceClip[];
    },
    enabled: !!sessionId,
  });
}

export function useUploadVoiceClip() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      audioBlob,
      durationSec,
      label,
    }: {
      sessionId: string;
      audioBlob: Blob;
      durationSec: number;
      label?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Upload to storage
      const fileName = `${user.id}/${sessionId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("go-dj-voice")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("go-dj-voice")
        .getPublicUrl(fileName);

      // Insert DB record
      const { data, error } = await supabase
        .from("go_dj_voice_clips")
        .insert({
          dj_user_id: user.id,
          session_id: sessionId,
          file_url: urlData.publicUrl,
          duration_sec: durationSec,
          label: label || "Voice Clip",
        })
        .select()
        .single();
      if (error) throw error;
      return data as GoDJVoiceClip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-voice-clips", data.session_id] });
    },
  });
}

export function useDeleteVoiceClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      sessionId,
      fileUrl,
    }: {
      id: string;
      sessionId: string;
      fileUrl: string;
    }) => {
      // Extract storage path from URL
      const bucketUrl = "/go-dj-voice/";
      const pathIndex = fileUrl.indexOf(bucketUrl);
      if (pathIndex !== -1) {
        const storagePath = fileUrl.substring(pathIndex + bucketUrl.length);
        await supabase.storage.from("go-dj-voice").remove([storagePath]);
      }

      const { error } = await supabase
        .from("go_dj_voice_clips")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["go-dj-voice-clips", data.sessionId] });
    },
  });
}
