import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDJListenerCount(sessionId?: string) {
  return useQuery({
    queryKey: ["dj-listener-count", sessionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("dj_session_listeners")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId!)
        .eq("counted", true);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!sessionId,
  });
}

export function useDJSessionTracks(sessionId?: string) {
  return useQuery({
    queryKey: ["dj-session-tracks", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_session_tracks")
        .select("*, tracks:track_id(id, title, cover_art_url, audio_url, artist_id, profiles:artist_id(display_name))")
        .eq("session_id", sessionId!)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
  });
}
