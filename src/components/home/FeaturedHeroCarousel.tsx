import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Play, Mic2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFeaturedTracks } from "@/hooks/useFeaturedContent";
import { useTrendingTracks, TrendingTrack } from "@/hooks/useTrendingTracks";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CarouselTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  has_karaoke: boolean | null;
  artist_id: string;
  artist_name: string | null;
  isFeatured?: boolean;
}

export function FeaturedHeroCarousel() {
  // Fetch admin-curated featured tracks first
  const { data: featuredTracks, isLoading: featuredLoading } = useFeaturedTracks("home_hero");
  // Fallback to trending tracks
  const { data: trendingTracks, isLoading: trendingLoading } = useTrendingTracks(5);
  const { playTrack } = useAudioPlayer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Combine featured and trending tracks, prioritizing featured
  const tracks = useMemo((): CarouselTrack[] => {
    const result: CarouselTrack[] = [];
    
    // Add featured tracks first
    if (featuredTracks && featuredTracks.length > 0) {
      featuredTracks.forEach((f) => {
        if (f.track) {
          result.push({
            id: f.track.id,
            title: f.track.title,
            audio_url: f.track.audio_url,
            cover_art_url: f.track.cover_art_url,
            price: f.track.price,
            has_karaoke: f.track.has_karaoke,
            artist_id: f.track.artist_id,
            artist_name: f.track.artist_name,
            isFeatured: true,
          });
        }
      });
    }

    // Fill remaining slots with trending tracks (up to 5 total)
    if (trendingTracks && result.length < 5) {
      const featuredIds = new Set(result.map((t) => t.id));
      trendingTracks.forEach((t: TrendingTrack) => {
        if (result.length < 5 && !featuredIds.has(t.id)) {
          result.push({
            id: t.id,
            title: t.title,
            audio_url: t.audio_url,
            cover_art_url: t.cover_art_url,
            price: t.price,
            has_karaoke: t.has_karaoke,
            artist_id: t.artist_id,
            artist_name: t.artist_name,
            isFeatured: false,
          });
        }
      });
    }

    return result;
  }, [featuredTracks, trendingTracks]);

  const isLoading = featuredLoading && trendingLoading;

  const goToNext = useCallback(() => {
    if (!tracks || tracks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  }, [tracks]);

  const goToPrev = useCallback(() => {
    if (!tracks || tracks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused || !tracks || tracks.length <= 1) return;
    
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [isPaused, tracks, goToNext]);

  // Reset index when tracks change
  useEffect(() => {
    setCurrentIndex(0);
  }, [tracks.length]);

  const handlePlay = (track: CarouselTrack) => {
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      price: track.price,
      artist: {
        id: track.artist_id,
        display_name: track.artist_name,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl bg-muted/30 animate-pulse flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-muted/50" />
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl glass-card flex items-center justify-center">
        <p className="text-muted-foreground">Discover trending tracks</p>
      </div>
    );
  }

  const currentTrack = tracks[currentIndex];

  return (
    <div
      className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden group border border-border shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 transition-all duration-700">
        {currentTrack.cover_art_url ? (
          <img
            src={currentTrack.cover_art_url}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        {/* Gradient overlays for readability - lighter to show more image */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        {/* Track Info */}
        <div className="flex items-end gap-4 md:gap-6">
          {/* Small Cover Art */}
          <div className="relative flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden shadow-2xl ring-2 ring-border">
            {currentTrack.cover_art_url ? (
              <img
                src={currentTrack.cover_art_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            {currentTrack.has_karaoke && (
              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <Mic2 className="w-3 h-3 text-accent-foreground" />
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full border",
                currentTrack.isFeatured 
                  ? "bg-card text-foreground border-border shadow-sm"
                  : "bg-card text-foreground border-border shadow-sm"
              )}>
                {currentTrack.isFeatured ? "FEATURED" : "TRENDING"}
              </span>
              {currentTrack.has_karaoke && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-card text-foreground border border-border shadow-sm flex items-center gap-1">
                  <Mic2 className="w-3 h-3" />
                  Karaoke
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-foreground truncate mb-1">
              {currentTrack.title}
            </h3>
            <Link
              to={`/artist/${currentTrack.artist_id}`}
              className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors"
            >
              {currentTrack.artist_name || "Unknown Artist"}
            </Link>
            <div className="flex items-center gap-4 mt-3">
              <Button
                size="lg"
                className="gradient-accent neon-glow-subtle"
                onClick={() => handlePlay(currentTrack)}
              >
                <Play className="w-5 h-5 mr-2" />
                Play Now
              </Button>
              <span className="text-lg md:text-xl font-semibold text-foreground">
                ${currentTrack.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {tracks.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300 border border-border/50",
                  idx === currentIndex
                    ? "w-8 bg-primary"
                    : "bg-card/80 hover:bg-card"
                )}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={goToPrev}
              className="w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}