import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoDJSessionDetail } from "@/hooks/useGoDJSessions";
import { useGoDJSegments } from "@/hooks/useGoDJSegments";
import { useGoDJVoiceClips } from "@/hooks/useGoDJVoiceClips";
import { useGoDJReactions, useReactToMix, useRemoveReaction } from "@/hooks/useGoDJReactions";
import { useGoDJListenerCount, useRecordListen } from "@/hooks/useGoDJListens";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Disc3, Headphones, Flame, Star, Rocket, Loader2, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function GoDJMixPlayback() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { data: session, isLoading } = useGoDJSessionDetail(sessionId);
  const { data: segments = [] } = useGoDJSegments(sessionId);
  const { data: voiceClips = [] } = useGoDJVoiceClips(sessionId);
  const { data: reactions } = useGoDJReactions(sessionId);
  const { data: listenerCount } = useGoDJListenerCount(sessionId);
  const reactToMix = useReactToMix();
  const removeReaction = useRemoveReaction();
  const recordListen = useRecordListen();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegIndex, setCurrentSegIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [hasRecordedListen, setHasRecordedListen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch DJ profile
  const { data: djProfile } = useQuery({
    queryKey: ["dj-profile-display", session?.dj_user_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", session!.dj_user_id).single();
      return data;
    },
    enabled: !!session?.dj_user_id,
  });

  // Fetch track data for segments
  const trackIds = segments.filter(s => s.segment_type === "track" && s.track_id).map(s => s.track_id!);
  const { data: trackData = {} } = useQuery({
    queryKey: ["playback-tracks", trackIds.join(",")],
    queryFn: async () => {
      if (!trackIds.length) return {};
      const { data: tracks } = await supabase.from("tracks").select("id, title, artist_id, cover_art_url, audio_url, duration").in("id", trackIds);
      const aids = [...new Set((tracks || []).map((t: any) => t.artist_id))];
      const { data: profiles } = aids.length ? await supabase.from("profiles").select("id, display_name").in("id", aids) : { data: [] };
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p: any) => { nameMap[p.id] = p.display_name || "Unknown"; });

      const map: Record<string, any> = {};
      tracks?.forEach((t: any) => { map[t.id] = { ...t, artist_name: nameMap[t.artist_id] || "Unknown" }; });
      return map;
    },
    enabled: trackIds.length > 0,
  });

  const voiceClipMap = useMemo(() => {
    const map: Record<string, any> = {};
    voiceClips.forEach(c => { map[c.id] = c; });
    return map;
  }, [voiceClips]);

  // Calculate chapter timestamps
  const chapters = useMemo(() => {
    let time = 0;
    return segments.map(seg => {
      const start = time;
      let duration = 0;
      if (seg.segment_type === "track" && seg.track_id && trackData[seg.track_id]) {
        const trackDur = trackData[seg.track_id].duration || 0;
        duration = (seg.trim_end_sec ?? trackDur) - seg.trim_start_sec;
      } else if (seg.segment_type === "voice" && seg.voice_clip_id && voiceClipMap[seg.voice_clip_id]) {
        duration = voiceClipMap[seg.voice_clip_id].duration_sec;
      }
      time += duration;
      return { ...seg, startTime: start, duration };
    });
  }, [segments, trackData, voiceClipMap]);

  const totalDuration = chapters.reduce((sum, ch) => sum + ch.duration, 0);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentSegIndex(-1);
    setProgress(0);
  }, []);

  const playSegment = useCallback((index: number) => {
    if (index >= segments.length) { cleanupAudio(); return; }
    const seg = segments[index];
    setCurrentSegIndex(index);

    let audioUrl: string | undefined;
    let startTime = 0;
    let endTime: number | undefined;

    if (seg.segment_type === "track" && seg.track_id && trackData[seg.track_id]) {
      audioUrl = trackData[seg.track_id].audio_url;
      startTime = seg.trim_start_sec;
      endTime = seg.trim_end_sec ?? undefined;
    } else if (seg.segment_type === "voice" && seg.voice_clip_id && voiceClipMap[seg.voice_clip_id]) {
      audioUrl = voiceClipMap[seg.voice_clip_id].file_url;
    }

    if (!audioUrl) { playSegment(index + 1); return; }

    const audio = audioRef.current!;
    audio.src = audioUrl;
    audio.currentTime = startTime;
    const onCanPlay = () => { audio.play().catch(() => {}); audio.removeEventListener("canplay", onCanPlay); };
    audio.addEventListener("canplay", onCanPlay);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (endTime && audio.currentTime >= endTime) playSegment(index + 1);
      const chapterInfo = chapters[index];
      if (chapterInfo) {
        const elapsed = audio.currentTime - startTime;
        const globalElapsed = chapterInfo.startTime + elapsed;
        setProgress(totalDuration > 0 ? (globalElapsed / totalDuration) * 100 : 0);
      }
    }, 200);

    // Record listen once
    if (!hasRecordedListen && sessionId) {
      recordListen.mutate(sessionId);
      setHasRecordedListen(true);
    }
  }, [segments, trackData, voiceClipMap, chapters, totalDuration, cleanupAudio, hasRecordedListen, sessionId, recordListen]);

  const handlePlayPause = () => {
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
    else if (currentSegIndex >= 0) { audioRef.current?.play(); setIsPlaying(true); }
    else { setIsPlaying(true); playSegment(0); }
  };

  const handleSeekToChapter = (index: number) => {
    playSegment(index);
    setIsPlaying(true);
  };

  useEffect(() => cleanupAudio, [cleanupAudio]);

  const reactionEmojis = [
    { emoji: "fire", icon: Flame, label: "Fire" },
    { emoji: "star", icon: Star, label: "Star" },
    { emoji: "rocket", icon: Rocket, label: "Rocket" },
    { emoji: "headphones", icon: Headphones, label: "Vibes" },
  ];

  if (isLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!session) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Session not found</p></div></Layout>;
  }

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Link to="/go-dj" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Go DJ
        </Link>

        {/* Hero */}
        <div className="glass-card overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 p-6">
            <div className="w-40 h-40 rounded-lg bg-muted/30 shrink-0 overflow-hidden mx-auto sm:mx-0">
              {session.cover_url ? (
                <img src={session.cover_url} alt={session.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-16 h-16 text-muted-foreground/30" /></div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Badge className="mb-2 bg-primary/20 text-primary text-xs">Go DJ Mix</Badge>
                <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
                {session.description && <p className="text-sm text-muted-foreground mt-1">{session.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {djProfile?.avatar_url && <img src={djProfile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                <span>{djProfile?.display_name || "DJ"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{listenerCount || 0} listens</span>
                {totalDuration > 0 && <><span>•</span><span>{formatTime(totalDuration)}</span></>}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handlePlayPause} className="gap-2" disabled={segments.length === 0}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play Mix"}
                </Button>
              </div>
            </div>
          </div>

          {currentSegIndex >= 0 && <Progress value={progress} className="h-1.5 rounded-none" />}
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-3">
          {reactionEmojis.map(({ emoji, icon: Icon, label }) => {
            const count = reactions?.counts[emoji] || 0;
            const isActive = reactions?.userReaction === emoji;
            return (
              <Button
                key={emoji}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (!user) return;
                  if (isActive) removeReaction.mutate(sessionId!);
                  else reactToMix.mutate({ sessionId: sessionId!, reaction: emoji });
                }}
              >
                <Icon className="w-4 h-4" />
                {count > 0 && <span>{count}</span>}
              </Button>
            );
          })}
        </div>

        {/* Tracklist / Chapters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Tracklist</h3>
          {chapters.map((ch, i) => {
            const isCurrentSeg = i === currentSegIndex;
            let label = "";
            let subtitle = "";

            if (ch.segment_type === "track" && ch.track_id && trackData[ch.track_id]) {
              label = trackData[ch.track_id].title;
              subtitle = trackData[ch.track_id].artist_name;
            } else if (ch.segment_type === "voice" && ch.voice_clip_id && voiceClipMap[ch.voice_clip_id]) {
              label = voiceClipMap[ch.voice_clip_id].label;
              subtitle = "Voice Drop";
            }

            return (
              <button
                key={ch.id}
                onClick={() => handleSeekToChapter(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  isCurrentSeg ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50"
                }`}
              >
                <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{formatTime(ch.startTime)}</span>
                {ch.segment_type === "track" ? (
                  <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                    {ch.track_id && trackData[ch.track_id]?.cover_art_url ? (
                      <img src={trackData[ch.track_id].cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(ch.duration)}</span>
              </button>
            );
          })}
        </div>

        <audio
          ref={audioRef}
          onEnded={() => playSegment(currentSegIndex + 1)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => { if (audioRef.current && !audioRef.current.ended) setIsPlaying(false); }}
          className="hidden"
        />
      </div>
    </Layout>
  );
}
