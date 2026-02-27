import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Mic } from "lucide-react";
import { GoDJSegment } from "@/hooks/useGoDJSegments";
import { Progress } from "@/components/ui/progress";
import { DuckingEngine } from "@/lib/duckingEngine";
import { Badge } from "@/components/ui/badge";

interface MixPreviewPlayerProps {
  segments: GoDJSegment[];
  trackData: Record<string, { title: string; audio_url: string; duration: number | null }>;
  voiceClipData: Record<string, { file_url: string; duration_sec: number; label: string }>;
  onSegmentHighlight?: (segmentId: string | null) => void;
  sessionMode?: string;
}

export function MixPreviewPlayer({
  segments,
  trackData,
  voiceClipData,
  onSegmentHighlight,
  sessionMode = "standard",
}: MixPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isVoiceOverlayActive, setIsVoiceOverlayActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const engineRef = useRef<DuckingEngine | null>(null);

  const isPro = sessionMode === "pro";

  // Filter segments for sequential playback based on mode
  const playableSegments = isPro
    ? segments.filter(
        (s) => !(s.segment_type === "voice" && s.overlay_start_sec != null)
      )
    : segments;

  const cleanupEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    cleanupEngine();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.src = "";
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentIndex(-1);
    setProgress(0);
    setIsVoiceOverlayActive(false);
    onSegmentHighlight?.(null);
  }, [onSegmentHighlight, cleanupEngine]);

  const startDuckingForSegment = useCallback(
    (trackSegment: GoDJSegment) => {
      cleanupEngine();
      if (!isPro || !voiceAudioRef.current || !audioRef.current) return;

      // Find voice overlays that belong to this track segment's time range
      const voiceOverlays = segments.filter(
        (s) =>
          s.segment_type === "voice" &&
          s.overlay_start_sec != null &&
          s.voice_clip_id
      );

      if (voiceOverlays.length === 0) return;

      const engine = new DuckingEngine(
        audioRef.current,
        voiceAudioRef.current,
        voiceOverlays,
        voiceClipData
      );
      engine.onVoiceStart = () => setIsVoiceOverlayActive(true);
      engine.onVoiceEnd = () => setIsVoiceOverlayActive(false);
      engine.start();
      engineRef.current = engine;
    },
    [isPro, segments, voiceClipData, cleanupEngine]
  );

  const playSegment = useCallback(
    (index: number) => {
      if (index >= playableSegments.length) {
        cleanupAudio();
        return;
      }

      const segment = playableSegments[index];
      setCurrentIndex(index);
      onSegmentHighlight?.(segment.id);

      let audioUrl: string | undefined;
      let startTime = 0;
      let endTime: number | undefined;

      if (segment.segment_type === "track" && segment.track_id) {
        const track = trackData[segment.track_id];
        if (!track?.audio_url) {
          playSegment(index + 1);
          return;
        }
        audioUrl = track.audio_url;
        startTime = segment.trim_start_sec;
        endTime = segment.trim_end_sec ?? undefined;
      } else if (segment.segment_type === "voice" && segment.voice_clip_id) {
        const clip = voiceClipData[segment.voice_clip_id];
        if (!clip?.file_url) {
          playSegment(index + 1);
          return;
        }
        audioUrl = clip.file_url;
      }

      if (!audioUrl) {
        playSegment(index + 1);
        return;
      }

      // Cleanup previous ducking engine before starting new segment
      cleanupEngine();

      const audio = audioRef.current!;
      audio.volume = 1.0;
      audio.src = audioUrl;
      audio.currentTime = startTime;

      const onCanPlay = () => {
        audio.play().catch(() => {});
        audio.removeEventListener("canplay", onCanPlay);

        // Start ducking engine for pro mode track segments
        if (segment.segment_type === "track") {
          startDuckingForSegment(segment);
        }
      };
      audio.addEventListener("canplay", onCanPlay);

      // Track progress and enforce trim_end
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (endTime && audio.currentTime >= endTime) {
          playSegment(index + 1);
        }
        const duration = endTime
          ? endTime - startTime
          : audio.duration || 1;
        const elapsed = audio.currentTime - startTime;
        setProgress(Math.min(100, (elapsed / duration) * 100));
      }, 200);
    },
    [playableSegments, trackData, voiceClipData, cleanupAudio, onSegmentHighlight, cleanupEngine, startDuckingForSegment]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (currentIndex >= 0) {
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
      playSegment(0);
    }
  };

  const handleSkip = () => {
    if (currentIndex < playableSegments.length - 1) {
      playSegment(currentIndex + 1);
    }
  };

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  const currentSegment = currentIndex >= 0 ? playableSegments[currentIndex] : null;
  let currentLabel = "Ready to preview";
  if (currentSegment) {
    if (currentSegment.segment_type === "track" && currentSegment.track_id) {
      currentLabel = trackData[currentSegment.track_id]?.title || "Track";
    } else if (currentSegment.segment_type === "voice" && currentSegment.voice_clip_id) {
      currentLabel = voiceClipData[currentSegment.voice_clip_id]?.label || "Voice";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handlePlayPause} className="gap-2" disabled={playableSegments.length === 0}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Preview Mix"}
        </Button>
        {isPlaying && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSkip}>
            <SkipForward className="w-4 h-4" />
          </Button>
        )}
        <span className="text-xs text-muted-foreground flex-1 truncate">{currentLabel}</span>
        {isVoiceOverlayActive && (
          <Badge variant="secondary" className="gap-1 text-xs animate-pulse">
            <Mic className="w-3 h-3" /> DJ Drop
          </Badge>
        )}
        {currentIndex >= 0 && (
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1}/{playableSegments.length}
          </span>
        )}
      </div>
      {currentIndex >= 0 && <Progress value={progress} className="h-1" />}
      <p className="text-xs text-muted-foreground italic">
        Final audio is rendered on Publish for best quality.
      </p>
      <audio
        ref={audioRef}
        onEnded={() => playSegment(currentIndex + 1)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          if (audioRef.current && !audioRef.current.ended) setIsPlaying(false);
        }}
        className="hidden"
      />
      <audio ref={voiceAudioRef} className="hidden" />
    </div>
  );
}
