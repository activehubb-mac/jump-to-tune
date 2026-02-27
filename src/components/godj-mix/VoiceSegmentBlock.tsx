import { GoDJSegment } from "@/hooks/useGoDJSegments";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowUp, ArrowDown, Trash2, Mic } from "lucide-react";

interface VoiceSegmentBlockProps {
  segment: GoDJSegment;
  clipInfo?: { label: string; duration_sec: number; file_url: string };
  isFirst: boolean;
  isLast: boolean;
  isHighlighted?: boolean;
  isProMode: boolean;
  onUpdate: (updates: Partial<GoDJSegment>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function VoiceSegmentBlock({
  segment,
  clipInfo,
  isFirst,
  isLast,
  isHighlighted,
  isProMode,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: VoiceSegmentBlockProps) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-all ${
        isHighlighted
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-dashed border-muted-foreground/30 bg-muted/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{clipInfo?.label || "Voice Clip"}</p>
          <p className="text-xs text-muted-foreground">{clipInfo?.duration_sec || 0}s</p>
        </div>
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

      {/* Pro mode overlay controls */}
      {isProMode && (
        <div className="space-y-2 pl-11">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Volume: {segment.voice_volume}%</label>
            <Slider
              value={[segment.voice_volume]}
              min={10}
              max={100}
              step={5}
              onValueChange={([v]) => onUpdate({ voice_volume: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Auto-duck music</label>
            <Switch
              checked={segment.ducking_enabled}
              onCheckedChange={(v) => onUpdate({ ducking_enabled: v })}
            />
          </div>
          {segment.ducking_enabled && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Duck level: {segment.ducking_db}dB</label>
              <Slider
                value={[Math.abs(segment.ducking_db)]}
                min={3}
                max={20}
                step={1}
                onValueChange={([v]) => onUpdate({ ducking_db: -v })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
