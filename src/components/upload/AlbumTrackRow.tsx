import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, X, ChevronDown, ChevronUp, Upload, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDuration, formatFileSize } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isValidLRC } from '@/lib/lrcParser';

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
  const [lyricsTab, setLyricsTab] = useState<'plain' | 'lrc'>('plain');
  const lrcInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleLyricsChange = (value: string) => {
    onUpdate({ ...track, lyrics: value });
  };

  const handleLrcFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (isValidLRC(text)) {
        onUpdate({ ...track, lyrics: text });
        setLyricsTab('lrc');
      }
    } catch (err) {
      console.error('Failed to read LRC file:', err);
    }
    
    if (lrcInputRef.current) {
      lrcInputRef.current.value = '';
    }
  };

  const lrcDetected = isValidLRC(track.lyrics || '');

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
        <div className="px-3 pb-4 pt-2 border-t border-glass-border">
          <div className="pl-[4.5rem] space-y-4">
            {/* Karaoke Toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id={`karaoke-${track.id}`}
                checked={track.hasKaraoke || false}
                onCheckedChange={handleKaraokeToggle}
                disabled={disabled}
              />
              <Label htmlFor={`karaoke-${track.id}`} className="text-sm flex items-center gap-2">
                <Mic className="w-4 h-4 text-accent" />
                Enable karaoke for this track
              </Label>
            </div>

            {/* Karaoke Lyrics Section */}
            {track.hasKaraoke && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-glass-border">
                {/* Header with LRC badge and import button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-foreground">Lyrics</Label>
                    {lrcDetected && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        LRC Synced
                      </span>
                    )}
                  </div>
                  
                  {/* LRC Upload Button */}
                  <div>
                    <input
                      ref={lrcInputRef}
                      type="file"
                      accept=".lrc,.txt"
                      onChange={handleLrcFileChange}
                      className="hidden"
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lrcInputRef.current?.click()}
                      disabled={disabled}
                      className="h-7 text-xs"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Import LRC
                    </Button>
                  </div>
                </div>

                {/* Tabs for Plain Text / LRC */}
                <Tabs value={lyricsTab} onValueChange={(v) => setLyricsTab(v as 'plain' | 'lrc')}>
                  <TabsList className="h-8 bg-muted/50">
                    <TabsTrigger value="plain" className="text-xs h-6">Plain Text</TabsTrigger>
                    <TabsTrigger value="lrc" className="text-xs h-6">LRC Format</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plain" className="mt-3">
                    <Textarea
                      value={track.lyrics || ''}
                      onChange={(e) => handleLyricsChange(e.target.value)}
                      placeholder="[Verse 1]&#10;Add your lyrics here...&#10;&#10;[Chorus]&#10;..."
                      rows={6}
                      className="bg-background/50 border-glass-border focus:border-accent resize-none font-mono text-sm"
                      disabled={disabled}
                    />
                  </TabsContent>
                  
                  <TabsContent value="lrc" className="mt-3 space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg border border-glass-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>LRC Format Example:</strong>
                      </p>
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
{`[ti:Song Title]
[ar:Artist Name]
[00:15.00]First line of lyrics
[00:20.50]Second line of lyrics
[00:25.00]Third line of lyrics`}
                      </pre>
                    </div>
                    <Textarea
                      value={track.lyrics || ''}
                      onChange={(e) => handleLyricsChange(e.target.value)}
                      placeholder="[00:00.00]Start of your lyrics..."
                      rows={6}
                      className="bg-background/50 border-glass-border focus:border-accent resize-none font-mono text-sm"
                      disabled={disabled}
                    />
                  </TabsContent>
                </Tabs>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    {lrcDetected 
                      ? "✓ Synchronized lyrics detected - lyrics will scroll with the music" 
                      : "Tip: Use LRC format for synchronized lyrics display"}
                  </span>
                  <span>{(track.lyrics || '').length} characters</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};