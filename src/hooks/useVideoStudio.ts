import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useEffect, useRef } from "react";

export interface VideoJob {
  id: string;
  user_id: string;
  track_id: string | null;
  video_type: string;
  export_format: string;
  duration_seconds: number;
  scene_prompt: string | null;
  style: string;
  status: string;
  credits_used: number;
  output_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export const VIDEO_TYPES = [
  { value: "music_video", label: "Music Video", desc: "Full cinematic AI music video synced to your track", icon: "Film" },
  { value: "lyric_video", label: "Lyric Video", desc: "Animated lyrics overlaid on styled visuals", icon: "Type" },
  { value: "viral_clip", label: "Viral Clip", desc: "Short vertical clip for TikTok, Reels & Shorts", icon: "Smartphone" },
  { value: "avatar_performance", label: "Avatar Performance", desc: "AI avatar performing to your music", icon: "User" },
] as const;

export const EXPORT_FORMATS = [
  { value: "9:16", label: "Vertical", desc: "TikTok / Reels / Shorts", ratio: "9:16" },
  { value: "16:9", label: "YouTube", desc: "Standard widescreen", ratio: "16:9" },
  { value: "1:1", label: "Square", desc: "Instagram / Facebook", ratio: "1:1" },
] as const;

export const STYLE_PRESETS = [
  { value: "cyberpunk", label: "Cyberpunk City" },
  { value: "anime", label: "Anime Universe" },
  { value: "luxury", label: "Luxury Nightclub" },
  { value: "dystopian", label: "Dystopian Army" },
  { value: "concert", label: "Futuristic Concert" },
  { value: "abstract", label: "Abstract Visualizer" },
  { value: "nature", label: "Cinematic Nature" },
  { value: "retro", label: "Retro VHS" },
] as const;

export const DURATION_OPTIONS = [
  { seconds: 10, credits: 130, label: "10s (480p)" },
  { seconds: 15, credits: 180, label: "15s (480p)" },
  { seconds: 20, credits: 240, label: "20s (480p)" },
  { seconds: -1, credits: 400, label: "HD (720p)" },
] as const;

export function useVideoStudio() {
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { refetch: refetchCredits } = useAICredits();
  const queryClient = useQueryClient();
  const prevJobsRef = useRef<VideoJob[]>([]);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<VideoJob[]>({
    queryKey: ["video-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_video_jobs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as VideoJob[];
    },
    enabled: !!user,
    refetchInterval: () => {
      // Poll every 5s if any job is active, otherwise 30s
      const active = (queryClient.getQueryData<VideoJob[]>(["video-jobs", user?.id]) ?? [])
        .some((j) => j.status === "queued" || j.status === "processing");
      return active ? 5000 : 30000;
    },
  });

  // Detect newly completed jobs and show toast
  useEffect(() => {
    const prev = prevJobsRef.current;
    if (prev.length > 0) {
      for (const job of jobs) {
        const old = prev.find((p) => p.id === job.id);
        if (old && old.status !== "completed" && job.status === "completed") {
          showFeedback({
            type: "success",
            title: "Video Ready! 🎬",
            message: "Your AI video has finished generating. Download it below.",
            autoClose: true,
          });
          refetchCredits();
        }
        if (old && old.status !== "failed" && job.status === "failed") {
          showFeedback({
            type: "error",
            title: "Video Failed",
            message: "Generation failed. Credits have been refunded.",
          });
          refetchCredits();
        }
      }
    }
    prevJobsRef.current = jobs;
  }, [jobs, showFeedback, refetchCredits]);

  const { data: artistTracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["artist-tracks-for-studio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("id, title, cover_art_url, genre")
        .eq("artist_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async (params: {
      track_id: string | null;
      video_type: string;
      export_format: string;
      duration_seconds: number;
      style: string;
      scene_prompt: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("ai-video-generator", {
        body: {
          ...params,
          prompt: params.scene_prompt || `${params.style} style ${params.video_type}`,
        },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) {
        let msg = "Generation failed.";
        try {
          const b = JSON.parse(error.context?.body);
          if (b.error) msg = b.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: (data) => {
      refetchCredits();
      queryClient.invalidateQueries({ queryKey: ["video-jobs"] });
      showFeedback({
        type: "success",
        title: "Video Queued! 🎬",
        message: `Used ${data.credits_used} credits. Generation takes 2-5 minutes.`,
        autoClose: true,
      });
    },
    onError: (err: Error) => {
      showFeedback({ type: "error", title: "Generation Failed", message: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("ai_video_jobs")
        .delete()
        .eq("id", jobId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-jobs"] });
    },
  });

  return {
    jobs,
    jobsLoading,
    artistTracks,
    tracksLoading,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    deleteJob: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
