import { useState, useRef, useEffect } from "react";

/**
 * Validates and extracts Spotify embed URL from various Spotify URL formats.
 * Supports: artist, album, track, playlist URLs
 * Returns null if invalid.
 */
function getSpotifyEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;

  try {
    const trimmed = url.trim();
    // Match patterns like:
    // https://open.spotify.com/artist/XXXX
    // https://open.spotify.com/track/XXXX?si=...
    // https://open.spotify.com/album/XXXX
    // https://open.spotify.com/playlist/XXXX
    const match = trimmed.match(
      /^https?:\/\/open\.spotify\.com\/(artist|track|album|playlist)\/([a-zA-Z0-9]+)/
    );
    if (!match) return null;

    const [, type, id] = match;
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

interface SpotifyEmbedProps {
  /** Any valid open.spotify.com URL (artist, track, album, playlist) */
  url: string;
  /** Compact = 152px height, full = 352px */
  variant?: "compact" | "full";
  className?: string;
}

export function SpotifyEmbed({ url, variant = "full", className }: SpotifyEmbedProps) {
  const embedUrl = getSpotifyEmbedUrl(url);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load: only render iframe when container enters viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!embedUrl) return null;

  const height = variant === "compact" ? 152 : 352;

  return (
    <div
      ref={containerRef}
      className={className}
    >
      {isVisible ? (
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl border-0"
          title="Spotify Player"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-redirect-uri"
        />
      ) : (
        <div
          className="rounded-xl bg-muted/30 animate-pulse"
          style={{ width: "100%", height }}
        />
      )}
    </div>
  );
}

export { getSpotifyEmbedUrl };
