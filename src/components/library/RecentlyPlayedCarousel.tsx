import { Play, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface RecentlyPlayedCarouselProps {
  limit?: number;
  showSeeAll?: boolean;
}

export function RecentlyPlayedCarousel({ 
  limit = 10, 
  showSeeAll = true 
}: RecentlyPlayedCarouselProps) {
  const { recentlyPlayed } = useRecentlyPlayed(limit);
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  const handlePlayTrack = async (track: typeof recentlyPlayed[number]) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
    
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      artist: {
        id: track.artist_id,
        display_name: track.artist_name,
      },
    });
  };

  if (recentlyPlayed.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Recently Played</h2>
        </div>
        {showSeeAll && (
          <Link 
            to="/library?filter=all"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide ios-scroll -mx-4 px-4">
        {recentlyPlayed.map((track) => {
          const isCurrentTrack = currentTrack?.id === track.id;
          const isCurrentlyPlaying = isCurrentTrack && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => handlePlayTrack(track)}
              className={cn(
                "flex-shrink-0 w-32 group text-left transition-all duration-200",
                "touch-manipulation select-none",
                "hover:scale-105 active:scale-95"
              )}
            >
              {/* Cover Art */}
              <div className={cn(
                "aspect-square rounded-lg bg-muted/50 mb-2 relative overflow-hidden",
                isCurrentlyPlaying && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}>
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                    <Play className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className={cn(
                  "absolute inset-0 bg-background/60 flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  isCurrentlyPlaying && "opacity-100"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "gradient-accent neon-glow"
                  )}>
                    <Play className={cn(
                      "w-4 h-4 ml-0.5 text-primary-foreground",
                      isCurrentlyPlaying && "animate-pulse"
                    )} />
                  </div>
                </div>

                {/* Currently playing indicator */}
                {isCurrentlyPlaying && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium">
                    Playing
                  </div>
                )}
              </div>

              {/* Track Info */}
              <h3 className="font-medium text-sm text-foreground truncate">
                {track.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist_name || "Unknown Artist"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
