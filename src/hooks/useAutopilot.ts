import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AutopilotProgress {
  track_uploaded: string;
  cover_art: string;
  video: string;
  avatar: string;
  release_page: string;
  karaoke: string;
  lyric_visual: string;
  promo_clips: string;
}

export interface AutopilotSession {
  id: string;
  user_id: string;
  track_id: string;
  status: string;
  prompt: string | null;
  credits_charged: number;
  cover_art_url: string | null;
  video_url: string | null;
  avatar_url: string | null;
  lyric_visual_url: string | null;
  promo_clips: Array<{ platform: string; caption: string; hashtags: string }>;
  progress: AutopilotProgress;
  metadata: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
}

const AUTOPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/artist-autopilot`;

export function useAutopilot() {
  const { user } = useAuth();
  const [session, setSession] = useState<AutopilotSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
    };
  }, []);

  const startAutopilot = useCallback(async (trackId: string, prompt?: string) => {
    setIsStarting(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(AUTOPILOT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "start", track_id: trackId, prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Failed to start Autopilot");
        return null;
      }
      return data.session_id as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [getAuthHeaders]);

  const pollStatus = useCallback(async (sessionId: string) => {
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(AUTOPILOT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "status", session_id: sessionId }),
      });
      const data = await resp.json();
      if (data.success && data.session) {
        setSession(data.session as AutopilotSession);
        if (data.session.status === "ready" || data.session.status === "published" || data.session.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    } catch {}
  }, [getAuthHeaders]);

  const startPolling = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollStatus(sessionId);
    pollRef.current = setInterval(() => pollStatus(sessionId), 3000);
  }, [pollStatus]);

  const publishRelease = useCallback(async (sessionId: string) => {
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(AUTOPILOT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "publish", session_id: sessionId }),
      });
      const data = await resp.json();
      if (data.success) {
        setSession((prev) => prev ? { ...prev, status: "published" } : null);
      }
      return data.success;
    } catch {
      return false;
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return {
    session,
    isStarting,
    error,
    startAutopilot,
    startPolling,
    publishRelease,
    setSession,
  };
}
