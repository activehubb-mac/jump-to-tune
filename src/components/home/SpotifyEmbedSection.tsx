import { useRef, useState, useEffect, useCallback } from "react";
import { Music, X, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "jumtunes_spotify_player_visible";

interface SpotifyEmbedSectionProps {
  uri: string;
}

function convertToEmbedUrl(uri: string): string | null {
  if (!uri) return null;
  try {
    const url = new URL(uri);
    if (!url.hostname.includes("spotify.com")) return null;
    const match = url.pathname.match(/\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

export function SpotifyEmbedSection({ uri }: SpotifyEmbedSectionProps) {
  const embedUrl = convertToEmbedUrl(uri);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lazyVisible, setLazyVisible] = useState(false);

  // Toggle state from localStorage (default: expanded)
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const openAndScroll = useCallback(() => {
    setExpanded(true);
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  // Lazy-load iframe via IntersectionObserver
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLazyVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (!embedUrl) return null;

  // Collapsed: show floating pill
  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={openAndScroll}
          className="rounded-full shadow-lg gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2"
          size="sm"
        >
          <Headphones className="w-4 h-4" />
          <span className="text-sm font-medium">Spotify Player</span>
        </Button>
      </div>
    );
  }

  // Expanded: full player
  return (
    <section className="py-10 md:py-14" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Listen on Spotify</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close Spotify player"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="glass-card-bordered rounded-xl overflow-hidden">
          {lazyVisible ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="border-0 md:h-[352px] h-[152px]"
              title="Spotify Player"
            />
          ) : (
            <div className="w-full h-[152px] md:h-[352px] bg-muted/30 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
