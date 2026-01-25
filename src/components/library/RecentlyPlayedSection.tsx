import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Pause, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecentlyPlayedSection() {
  const { recentlyPlayed } = useRecentlyPlayed(5);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();

  if (recentlyPlayed.length === 0) return null;

  const handlePlay = (track: typeof recentlyPlayed[0]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        audio_url: "", // Will be fetched when played
        cover_art_url: track.cover_art_url,
        artist: {
          id: track.artist_id,
          display_name: track.artist_name,
        },
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recently Played
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {recentlyPlayed.map((track) => {
          const isCurrentTrack = currentTrack?.id === track.id;
          const isCurrentlyPlaying = isCurrentTrack && isPlaying;

          return (
            <div
              key={track.id}
              className={cn(
                "flex-shrink-0 w-28 group cursor-pointer",
                isCurrentTrack && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
              )}
              onClick={() => handlePlay(track)}
            >
              <div className="relative aspect-square rounded-md overflow-hidden mb-2 shadow-md">
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                  isCurrentlyPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Button
                    size="icon"
                    className="w-10 h-10 rounded-full gradient-accent shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(track);
                    }}
                  >
                    {isCurrentlyPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                </div>

                {/* Now playing indicator */}
                {isCurrentlyPlaying && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    <div className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
                    <div className="w-0.5 h-2 bg-primary animate-pulse rounded-full delay-75" />
                    <div className="w-0.5 h-4 bg-primary animate-pulse rounded-full delay-150" />
                  </div>
                )}
              </div>
              <h3 className="text-xs font-medium text-foreground truncate">
                {track.title}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {track.artist_name || "Unknown"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
