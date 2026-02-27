import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward } from "lucide-react";
import { GoDJSegment } from "@/hooks/useGoDJSegments";
import { Progress } from "@/components/ui/progress";

interface MixPreviewPlayerProps {
  segments: GoDJSegment[];
  trackData: Record<string, { title: string; audio_url: string; duration: number | null }>;
  voiceClipData: Record<string, { file_url: string; duration_sec: number; label: string }>;
  onSegmentHighlight?: (segmentId: string | null) => void;
}

export function MixPreviewPlayer({
  segments,
  trackData,
  voiceClipData,
  onSegmentHighlight,
}: MixPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentIndex(-1);
    setProgress(0);
    onSegmentHighlight?.(null);
  }, [onSegmentHighlight]);

  const playSegment = useCallback(
    (index: number) => {
      if (index >= segments.length) {
        cleanupAudio();
        return;
      }

      const segment = segments[index];
      setCurrentIndex(index);
      onSegmentHighlight?.(segment.id);

      let audioUrl: string | undefined;
      let startTime = 0;
      let endTime: number | undefined;

      if (segment.segment_type === "track" && segment.track_id) {
        const track = trackData[segment.track_id];
        if (!track?.audio_url) {
          // Skip this segment
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

      const audio = audioRef.current!;
      audio.src = audioUrl;
      audio.currentTime = startTime;

      const onCanPlay = () => {
        audio.play().catch(() => {});
        audio.removeEventListener("canplay", onCanPlay);
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
    [segments, trackData, voiceClipData, cleanupAudio, onSegmentHighlight]
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
    if (currentIndex < segments.length - 1) {
      playSegment(currentIndex + 1);
    }
  };

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  const currentSegment = currentIndex >= 0 ? segments[currentIndex] : null;
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
        <Button size="sm" onClick={handlePlayPause} className="gap-2" disabled={segments.length === 0}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Preview Mix"}
        </Button>
        {isPlaying && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSkip}>
            <SkipForward className="w-4 h-4" />
          </Button>
        )}
        <span className="text-xs text-muted-foreground flex-1 truncate">{currentLabel}</span>
        {currentIndex >= 0 && (
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1}/{segments.length}
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
    </div>
  );
}
