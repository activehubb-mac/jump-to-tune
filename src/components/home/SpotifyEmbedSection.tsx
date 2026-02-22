import { useRef, useState, useEffect, useCallback } from "react";
import { Music, X } from "lucide-react";
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

  // Default to collapsed (false) so floating button shows first
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
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

  // Collapsed: show floating Spotify-branded button
  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={openAndScroll}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#1DB954" }}
          aria-label="Open Spotify Player"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381C8.88 5.82 15.78 6.12 20.1 8.82c.54.3.72 1.02.42 1.56-.299.421-1.02.599-1.439.3z" />
          </svg>
        </button>
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
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              className="border-0 w-full h-[352px]"
              title="Spotify Player"
            />
          ) : (
            <div className="w-full h-[352px] bg-muted/30 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
