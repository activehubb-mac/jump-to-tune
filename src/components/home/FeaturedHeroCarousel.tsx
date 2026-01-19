import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Mic2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTrendingTracks, TrendingTrack } from "@/hooks/useTrendingTracks";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeaturedHeroCarousel() {
  const { data: tracks, isLoading } = useTrendingTracks(5);
  const { playTrack } = useAudioPlayer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  const handlePlay = (track: TrendingTrack) => {
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
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
      className="relative w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden group"
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
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
        )}
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        {/* Track Info */}
        <div className="flex items-end gap-4 md:gap-6">
          {/* Small Cover Art */}
          <div className="relative flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20">
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                TRENDING
              </span>
              {currentTrack.has_karaoke && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
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
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "w-8 bg-primary"
                    : "bg-white/30 hover:bg-white/50"
                )}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={goToPrev}
              className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
