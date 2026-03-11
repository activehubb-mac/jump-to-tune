import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Mic, MicOff, ChevronUp, ChevronDown, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { parseLRC, getCurrentLineIndex, isValidLRC, LyricLine } from '@/lib/lrcParser';
import { motion, AnimatePresence } from 'framer-motion';

interface KaraokeLyricsPanelProps {
  lyrics: string | null;
  currentTime: number;
  duration: number;
  isKaraokeActive: boolean;
  onClose: () => void;
  onSeek?: (time: number) => void;
  trackTitle?: string;
  artistName?: string;
}

export function KaraokeLyricsPanel({
  lyrics,
  currentTime,
  duration,
  isKaraokeActive,
  onClose,
  onSeek,
  trackTitle,
  artistName,
}: KaraokeLyricsPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Parse lyrics (supports both LRC and plain text)
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return { lines: [], metadata: {} };
    
    if (isValidLRC(lyrics)) {
      return parseLRC(lyrics);
    }
    
    // For plain text, split into lines without timestamps
    const plainLines: LyricLine[] = lyrics
      .split('\n')
      .filter(line => line.trim())
      .map((text, index) => ({
        time: -1, // No timestamp
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
    if (autoScroll && activeLineRef.current && hasTimestamps) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex, autoScroll, hasTimestamps]);

  // Handle manual scroll - disable auto-scroll temporarily
  const handleScroll = () => {
    // Re-enable auto-scroll after 3 seconds of no scrolling
    setAutoScroll(false);
    const timeout = setTimeout(() => setAutoScroll(true), 3000);
    return () => clearTimeout(timeout);
  };

  const handleLineClick = (line: LyricLine) => {
    if (onSeek && line.time >= 0) {
      onSeek(line.time);
      setAutoScroll(true);
    }
  };

  if (!lyrics || parsedLyrics.lines.length === 0) {
    return (
      <div className="fixed bottom-20 md:bottom-16 left-4 right-4 md:left-auto md:right-20 z-50 w-auto md:w-96 glass-card border border-glass-border/30 rounded-lg overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="p-4 flex items-center justify-between border-b border-glass-border/30">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Lyrics</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-8 text-center">
          <Music className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No lyrics available</p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Lyrics will appear here when available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-20 md:bottom-16 left-4 right-4 md:left-auto md:right-20 z-50 w-auto md:w-96",
        "glass-card border border-glass-border/30 backdrop-blur-xl rounded-lg overflow-hidden",
        "animate-in slide-in-from-bottom duration-200",
        !isExpanded && "h-auto"
      )}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-glass-border/30 bg-background/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            isKaraokeActive ? "bg-primary/20" : "bg-muted/50"
          )}>
            {isKaraokeActive ? (
              <Mic className="w-3 h-3 text-primary" />
            ) : (
              <MicOff className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {trackTitle || 'Lyrics'}
            </p>
            {artistName && (
              <p className="text-xs text-muted-foreground truncate">{artistName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lyrics Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-72 md:h-80"
              onScrollCapture={handleScroll}
            >
              <div className="p-4 space-y-3">
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
                        isClickable && "cursor-pointer hover:bg-white/5",
                        isActive && "bg-primary/10 scale-[1.02]",
                        isPast && "opacity-50"
                      )}
                      onClick={() => handleLineClick(line)}
                    >
                      <p 
                        className={cn(
                          "text-center transition-all duration-300 leading-relaxed",
                          isActive 
                            ? "text-lg font-semibold text-primary" 
                            : isPast 
                              ? "text-sm text-muted-foreground"
                              : "text-base text-foreground/80"
                        )}
                      >
                        {line.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer with sync status */}
            {hasTimestamps && (
              <div className="px-4 py-2 border-t border-glass-border/20 bg-background/30">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "flex items-center gap-1",
                    autoScroll ? "text-primary" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      autoScroll ? "bg-primary animate-pulse" : "bg-muted-foreground"
                    )} />
                    {autoScroll ? 'Auto-scrolling' : 'Scroll to resume'}
                  </span>
                  <span className="text-muted-foreground">
                    {currentLineIndex + 1} / {parsedLyrics.lines.length}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
