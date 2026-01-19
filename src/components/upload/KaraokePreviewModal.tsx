import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLRC, getCurrentLineIndex, isValidLRC, LyricLine } from '@/lib/lrcParser';
import { formatDuration } from '@/lib/audioUtils';
import { WaveformVisualizer } from '@/components/audio/WaveformVisualizer';

interface KaraokePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioFile: File;
  instrumentalFile?: File | null;
  lyrics: string;
  trackTitle: string;
}

export function KaraokePreviewModal({
  open,
  onOpenChange,
  audioFile,
  instrumentalFile,
  lyrics,
  trackTitle,
}: KaraokePreviewModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [useInstrumental, setUseInstrumental] = useState(!!instrumentalFile);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Create object URL for the audio file
  useEffect(() => {
    const file = useInstrumental && instrumentalFile ? instrumentalFile : audioFile;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioFile, instrumentalFile, useInstrumental]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentTime(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [open]);

  // Parse lyrics
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return { lines: [], metadata: {} };
    
    if (isValidLRC(lyrics)) {
      return parseLRC(lyrics);
    }
    
    const plainLines: LyricLine[] = lyrics
      .split('\n')
      .filter(line => line.trim())
      .map((text) => ({
        time: -1,
        text: text.trim(),
      }));
    
    return { lines: plainLines, metadata: {} };
  }, [lyrics]);

  const hasTimestamps = parsedLyrics.lines.some(line => line.time >= 0);
  const currentLineIndex = hasTimestamps 
    ? getCurrentLineIndex(parsedLyrics.lines, currentTime)
    : -1;

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && hasTimestamps) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex, hasTimestamps]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleLineClick = (line: LyricLine) => {
    if (audioRef.current && line.time >= 0) {
      audioRef.current.currentTime = line.time;
      setCurrentTime(line.time);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleAudioSource = () => {
    const wasPlaying = isPlaying;
    const prevTime = currentTime;
    
    setUseInstrumental(!useInstrumental);
    setIsPlaying(false);
    
    // Restore position after source change
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = prevTime;
        if (wasPlaying) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Karaoke Preview: {trackTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Audio Source Toggle */}
        {instrumentalFile && (
          <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
            <span className={cn(
              "text-xs transition-colors",
              !useInstrumental ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              Original
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAudioSource}
              className="h-7 text-xs"
            >
              {useInstrumental ? 'Playing Instrumental' : 'Playing Original'}
            </Button>
            <span className={cn(
              "text-xs transition-colors",
              useInstrumental ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              Instrumental
            </span>
          </div>
        )}

        {/* Lyrics Display */}
        <ScrollArea className="flex-1 h-64 border border-glass-border rounded-lg bg-muted/20">
          <div className="p-4 space-y-2">
            {!hasTimestamps && (
              <div className="p-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                <p className="text-xs text-amber-500">
                  ⚠️ No timestamps detected. Add LRC format timestamps for synchronized lyrics.
                </p>
              </div>
            )}
            
            {parsedLyrics.lines.map((line, index) => {
              const isActive = hasTimestamps && index === currentLineIndex;
              const isPast = hasTimestamps && line.time >= 0 && index < currentLineIndex;
              const isClickable = hasTimestamps && line.time >= 0;

              return (
                <div
                  key={`${line.time}-${index}`}
                  ref={isActive ? activeLineRef : null}
                  className={cn(
                    "py-2 px-3 rounded-lg transition-all duration-300",
                    isClickable && "cursor-pointer hover:bg-primary/5",
                    isActive && "bg-primary/15 scale-[1.02] shadow-sm",
                    isPast && "opacity-40"
                  )}
                  onClick={() => handleLineClick(line)}
                >
                  <p className={cn(
                    "text-center transition-all duration-300 leading-relaxed",
                    isActive 
                      ? "text-lg font-semibold text-primary" 
                      : isPast 
                        ? "text-sm text-muted-foreground"
                        : "text-base text-foreground/80"
                  )}>
                    {line.text}
                  </p>
                  {isClickable && (
                    <p className="text-center text-[10px] text-muted-foreground mt-0.5">
                      {formatDuration(line.time)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Waveform Visualizer */}
        <div className="space-y-2">
          <WaveformVisualizer
            audioFile={useInstrumental && instrumentalFile ? instrumentalFile : audioFile}
            currentTime={currentTime}
            duration={duration}
            onSeek={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
            className="h-14"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            className="h-9 w-9"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-9 w-9"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>

        {/* Sync Status */}
        {hasTimestamps && (
          <div className="text-center text-xs text-muted-foreground">
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Synced • Line {currentLineIndex + 1} of {parsedLyrics.lines.length}
            </span>
          </div>
        )}

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}