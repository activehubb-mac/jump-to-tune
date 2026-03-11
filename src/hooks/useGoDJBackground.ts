import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GoDJBackground {
  videoUrl: string;
  playbackRate: number;
  overlayOpacity: number;
}

const DEFAULTS: GoDJBackground = {
  videoUrl: "/videos/godj-bg.mov",
  playbackRate: 0.8,
  overlayOpacity: 60,
};

export function useGoDJBackground() {
  return useQuery({
    queryKey: ["godj-background-active"],
    queryFn: async (): Promise<GoDJBackground> => {
      const { data, error } = await supabase
        .from("godj_backgrounds")
        .select("video_url, playback_rate, overlay_opacity")
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return DEFAULTS;

      return {
        videoUrl: data.video_url,
        playbackRate: Number(data.playback_rate),
        overlayOpacity: Number(data.overlay_opacity),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
