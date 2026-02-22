import { useRef, useState, useEffect } from "react";
import { Music } from "lucide-react";

interface SpotifyEmbedSectionProps {
  uri: string;
}

function convertToEmbedUrl(uri: string): string | null {
  if (!uri) return null;
  try {
    const url = new URL(uri);
    if (!url.hostname.includes("spotify.com")) return null;
    // e.g. /playlist/xxx, /album/xxx, /track/xxx
    const match = url.pathname.match(/\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

export function SpotifyEmbedSection({ uri }: SpotifyEmbedSectionProps) {
  const embedUrl = convertToEmbedUrl(uri);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!embedUrl) return null;

  return (
    <section className="py-10 md:py-14" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Listen on Spotify</h2>
        </div>
        <div className="glass-card-bordered rounded-xl overflow-hidden">
          {visible ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="border-0"
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
