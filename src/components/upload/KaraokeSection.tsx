import { useState, useRef, useCallback } from 'react';
import { Mic, Music, X, Info, FileText, Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isValidAudioFile, formatFileSize } from '@/lib/audioUtils';
import { isValidLRC } from '@/lib/lrcParser';
import { cn } from '@/lib/utils';

interface KaraokeSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  instrumentalFile: File | null;
  onInstrumentalChange: (file: File | null) => void;
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  disabled?: boolean;
  onPreview?: () => void;
  singModeEnabled?: boolean;
  onSingModeChange?: (enabled: boolean) => void;
}

export const KaraokeSection = ({
  enabled,
  onEnabledChange,
  instrumentalFile,
  onInstrumentalChange,
  lyrics,
  onLyricsChange,
  disabled,
  onPreview,
  singModeEnabled = false,
  onSingModeChange,
}: KaraokeSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lyricsTab, setLyricsTab] = useState<'plain' | 'lrc'>('plain');
  const inputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    if (!isValidAudioFile(file)) {
      setError('Invalid file type. Please upload MP3, WAV, or FLAC.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    onInstrumentalChange(file);
  }, [onInstrumentalChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onInstrumentalChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleLrcFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (isValidLRC(text)) {
        onLyricsChange(text);
        setLyricsTab('lrc');
      } else {
        setError('Invalid LRC file. Please upload a valid .lrc file with timestamps.');
      }
    } catch (err) {
      setError('Failed to read LRC file.');
    }
    
    if (lrcInputRef.current) {
      lrcInputRef.current.value = '';
    }
  };

  const lrcDetected = isValidLRC(lyrics);

  return (
    <div className="glass-card p-4 sm:p-6 space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Mic className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="karaoke-toggle" className="text-foreground font-medium">
                Karaoke Mode
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Let fans sing along with your instrumental version. Upload the same track without vocals and add your lyrics.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">Add an instrumental version and lyrics</p>
          </div>
        </div>
        <Switch
          id="karaoke-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      {/* Karaoke Content */}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-glass-border">
          {/* Instrumental Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-foreground">Instrumental Version</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Upload a version of your track without vocals. This will play when fans enable karaoke mode.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {instrumentalFile ? (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Music className="w-5 h-5 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {instrumentalFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(instrumentalFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  isDragging ? "border-accent bg-accent/5" : "border-glass-border hover:border-accent/50",
                  error && "border-destructive/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/flac"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={disabled}
                />
                <Music className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Drop instrumental file here</p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, FLAC up to 50MB</p>
              </div>
            )}
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="lyrics" className="text-foreground">Lyrics</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Add your song lyrics. For synchronized karaoke, use LRC format with timestamps like [00:15.00]Lyrics here.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {lrcDetected && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    LRC Synced
                  </span>
                )}
              </div>
              
              {/* LRC Upload Button */}
              <div className="flex items-center gap-2">
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

            <Tabs value={lyricsTab} onValueChange={(v) => setLyricsTab(v as 'plain' | 'lrc')}>
              <TabsList className="h-8">
                <TabsTrigger value="plain" className="text-xs h-6">Plain Text</TabsTrigger>
                <TabsTrigger value="lrc" className="text-xs h-6">LRC Format</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plain" className="mt-2">
                <Textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => onLyricsChange(e.target.value)}
                  placeholder="[Verse 1]&#10;Add your lyrics here...&#10;&#10;[Chorus]&#10;..."
                  rows={8}
                  className="bg-muted/50 border-glass-border focus:border-accent resize-none font-mono text-sm"
                  disabled={disabled}
                />
              </TabsContent>
              
              <TabsContent value="lrc" className="mt-2 space-y-2">
                <div className="p-3 bg-muted/30 rounded-lg border border-glass-border">
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
                  id="lyrics-lrc"
                  value={lyrics}
                  onChange={(e) => onLyricsChange(e.target.value)}
                  placeholder="[00:00.00]Start of your lyrics..."
                  rows={8}
                  className="bg-muted/50 border-glass-border focus:border-accent resize-none font-mono text-sm"
                  disabled={disabled}
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {lrcDetected 
                  ? "✓ Synchronized lyrics detected - lyrics will scroll with the music" 
                  : "Tip: Use LRC format for synchronized lyrics display"}
              </span>
              <div className="flex items-center gap-3">
                <span>{lyrics.length} characters</span>
                {onPreview && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onPreview}
                    disabled={disabled}
                    className="h-7 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Preview Sync
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
