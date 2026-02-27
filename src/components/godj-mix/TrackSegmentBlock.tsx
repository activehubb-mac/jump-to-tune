import { GoDJSegment } from "@/hooks/useGoDJSegments";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowUp, ArrowDown, Trash2, Music } from "lucide-react";
import { useState, useEffect } from "react";

interface TrackSegmentBlockProps {
  segment: GoDJSegment;
  trackInfo?: {
    title: string;
    artist_name: string;
    cover_art_url: string | null;
    duration: number | null; // total track duration in seconds
  };
  isFirst: boolean;
  isLast: boolean;
  isHighlighted?: boolean;
  onUpdate: (updates: Partial<GoDJSegment>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function TrackSegmentBlock({
  segment,
  trackInfo,
  isFirst,
  isLast,
  isHighlighted,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: TrackSegmentBlockProps) {
  const maxDuration = trackInfo?.duration || 300;
  const [trimStart, setTrimStart] = useState(segment.trim_start_sec);
  const [trimEnd, setTrimEnd] = useState(segment.trim_end_sec ?? maxDuration);
  const [fadeIn, setFadeIn] = useState(segment.fade_in_sec);
  const [fadeOut, setFadeOut] = useState(segment.fade_out_sec);

  useEffect(() => {
    setTrimStart(segment.trim_start_sec);
    setTrimEnd(segment.trim_end_sec ?? maxDuration);
    setFadeIn(segment.fade_in_sec);
    setFadeOut(segment.fade_out_sec);
  }, [segment, maxDuration]);

  const effectiveDuration = trimEnd - trimStart;

  const commitUpdate = (field: string, value: number | null) => {
    onUpdate({ [field]: value });
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-3 transition-all ${
        isHighlighted
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {trackInfo?.cover_art_url ? (
            <img src={trackInfo.cover_art_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{trackInfo?.title || "Unknown Track"}</p>
          <p className="text-xs text-muted-foreground truncate">{trackInfo?.artist_name || "Unknown"}</p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {Math.round(effectiveDuration)}s
        </span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={isFirst} onClick={onMoveUp}>
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={isLast} onClick={onMoveDown}>
            <ArrowDown className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Trim controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Trim Start: {trimStart}s</label>
          <Slider
            value={[trimStart]}
            min={0}
            max={Math.max(0, trimEnd - 1)}
            step={1}
            onValueChange={([v]) => setTrimStart(v)}
            onValueCommit={([v]) => commitUpdate("trim_start_sec", v)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Trim End: {trimEnd}s</label>
          <Slider
            value={[trimEnd]}
            min={trimStart + 1}
            max={maxDuration}
            step={1}
            onValueChange={([v]) => setTrimEnd(v)}
            onValueCommit={([v]) => commitUpdate("trim_end_sec", v === maxDuration ? null : v)}
          />
        </div>
      </div>

      {/* Fade controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Fade In: {fadeIn}s</label>
          <Slider
            value={[fadeIn]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={([v]) => setFadeIn(v)}
            onValueCommit={([v]) => commitUpdate("fade_in_sec", v)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Fade Out: {fadeOut}s</label>
          <Slider
            value={[fadeOut]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={([v]) => setFadeOut(v)}
            onValueCommit={([v]) => commitUpdate("fade_out_sec", v)}
          />
        </div>
      </div>
    </div>
  );
}
