import { useState, useEffect, useRef } from "react";
import { parseLRC, type LRCLine } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";

interface LyricsDisplayProps {
  lyrics: string;
  currentTime: number;
  className?: string;
}

export function LyricsDisplay({ lyrics, currentTime, className }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parsedLines, setParsedLines] = useState<LRCLine[]>([]);
  const [isLRC, setIsLRC] = useState(false);

  useEffect(() => {
    const lines = parseLRC(lyrics);
    if (lines.length > 0 && lines[0].time !== undefined) {
      setIsLRC(true);
      setParsedLines(lines);
    } else {
      setIsLRC(false);
      // Split plain text into lines
      setParsedLines(
        lyrics.split("\n").map((text, i) => ({ time: i * 4, text }))
      );
    }
  }, [lyrics]);

  // Find active line index
  const activeIndex = isLRC
    ? parsedLines.findLastIndex((line) => currentTime >= (line.time ?? 0))
    : -1;

  // Auto-scroll to active line
  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center gap-2 overflow-y-auto px-4 py-8 text-center",
        className
      )}
    >
      {parsedLines.map((line, i) => (
        <p
          key={i}
          className={cn(
            "text-lg sm:text-xl font-bold transition-all duration-300 leading-relaxed",
            i === activeIndex
              ? "text-primary scale-110 drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
              : i < activeIndex
              ? "text-muted-foreground/40 scale-95"
              : "text-foreground/60"
          )}
        >
          {line.text || "\u00A0"}
        </p>
      ))}
    </div>
  );
}
