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
        .select("id, session_id, track_id, embed_url, embed_type, position, added_at")
        .eq("session_id", sessionId!)
        .order("position", { ascending: true });

      if (error) throw error;

      // Fetch full track details for jumtunes tracks (including audio_url for playback)
      const trackIds = (data || []).filter(d => d.track_id).map(d => d.track_id!);
      let trackMap: Record<string, any> = {};

      if (trackIds.length > 0) {
        const { data: trackData } = await supabase
          .from("tracks")
          .select("id, title, cover_art_url, artist_id, audio_url, duration, price")
          .in("id", trackIds);

        if (trackData) {
          const artistIds = [...new Set(trackData.map(t => t.artist_id))];
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", artistIds);

          const profileMap = new Map(profileData?.map(p => [p.id, p]) || []);

          trackData.forEach(t => {
            trackMap[t.id] = {
              ...t,
              profiles: profileMap.get(t.artist_id) || { display_name: "Unknown" },
            };
          });
        }
      }

      return (data || []).map(item => ({
        ...item,
        tracks: item.track_id ? trackMap[item.track_id] || null : null,
      }));
    },
    enabled: !!sessionId,
  });
}

export function useDJSessionSpotify(sessionId?: string) {
  return useQuery({
    queryKey: ["dj-session-spotify", sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dj_session_spotify")
        .select("*")
        .eq("session_id", sessionId!)
        .single();

      if (error) throw error;
      return data as { session_id: string; spotify_url_raw: string; spotify_embed_url: string } | null;
    },
    enabled: !!sessionId,
  });
}
