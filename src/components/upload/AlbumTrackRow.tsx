import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDuration, formatFileSize } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface AlbumTrackData {
  id: string;
  file: File;
  duration: number;
  title: string;
  trackNumber: number;
  price: number;
  hasKaraoke?: boolean;
  instrumentalFile?: File | null;
  lyrics?: string;
}

interface AlbumTrackRowProps {
  track: AlbumTrackData;
  onUpdate: (track: AlbumTrackData) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const AlbumTrackRow = ({ track, onUpdate, onRemove, disabled }: AlbumTrackRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...track, title: e.target.value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...track, price: parseFloat(e.target.value) || 0 });
  };

  const handleKaraokeToggle = (enabled: boolean) => {
    onUpdate({ 
      ...track, 
      hasKaraoke: enabled,
      instrumentalFile: enabled ? track.instrumentalFile : null,
      lyrics: enabled ? track.lyrics : '',
    });
  };

  const handleLyricsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...track, lyrics: e.target.value });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "glass-card border border-glass-border rounded-lg transition-all",
        isDragging && "opacity-50 shadow-lg",
        disabled && "opacity-50"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Track Number */}
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">{track.trackNumber}</span>
        </div>

        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Music className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Title Input */}
        <div className="flex-1 min-w-0">
          <Input
            value={track.title}
            onChange={handleTitleChange}
            placeholder="Track title"
            className="bg-transparent border-none h-8 px-0 font-medium text-foreground focus-visible:ring-0"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            {formatDuration(track.duration)} • {formatFileSize(track.file.size)}
          </p>
        </div>

        {/* Price Input */}
        <div className="w-24 flex-shrink-0">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={track.price}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="bg-muted/50 border-glass-border h-8 text-sm"
            disabled={disabled}
          />
        </div>

        {/* Expand/Collapse */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Remove */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(track.id)}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-glass-border">
          <div className="pl-[4.5rem] space-y-4">
            {/* Karaoke Toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id={`karaoke-${track.id}`}
                checked={track.hasKaraoke || false}
                onCheckedChange={handleKaraokeToggle}
                disabled={disabled}
              />
              <Label htmlFor={`karaoke-${track.id}`} className="text-sm">
                Enable karaoke for this track
              </Label>
            </div>

            {/* Karaoke Lyrics */}
            {track.hasKaraoke && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Lyrics (LRC format for sync, or plain text)
                </Label>
                <Textarea
                  value={track.lyrics || ''}
                  onChange={handleLyricsChange}
                  placeholder="Paste lyrics here..."
                  className="bg-muted/50 border-glass-border min-h-20 resize-none text-sm"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
