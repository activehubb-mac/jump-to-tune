import { Play, Disc3, ListPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { DownloadButton } from "@/components/download/DownloadButton";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface OwnedTrackCardProps {
  track: {
    id: string;
    title: string;
    audio_url: string;
    cover_art_url: string | null;
    duration: number | null;
    price: number;
    artist?: {
      id: string;
      display_name: string | null;
    } | null;
  };
  onAddToQueue?: () => void;
  showAddToQueue?: boolean;
}

export function OwnedTrackCard({
  track,
  onAddToQueue,
  showAddToQueue = true,
}: OwnedTrackCardProps) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
    
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      artist: track.artist || undefined,
    });
  };

  return (
    <div
      onClick={handlePlay}
      className={cn(
        "glass-card p-4 group cursor-pointer transition-all duration-300",
        "hover:bg-primary/10",
        isCurrentlyPlaying && "bg-primary/5"
      )}
    >
      {/* Cover Art with Owned Ring */}
      <div className={cn(
        "aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden",
        "owned-track-ring"
      )}>
        {track.cover_art_url ? (
          <img
            src={track.cover_art_url}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Disc3 className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button 
            size="icon" 
            className="rounded-full gradient-accent neon-glow w-10 h-10"
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
          >
            <Play className="w-4 h-4 ml-0.5" />
          </Button>
          {showAddToQueue && onAddToQueue && (
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue();
              }}
            >
              <ListPlus className="w-4 h-4" />
            </Button>
          )}
          <DownloadButton
            track={{
              id: track.id,
              title: track.title,
              cover_art_url: track.cover_art_url,
              price: track.price,
              audio_url: track.audio_url,
              artist: track.artist ? { display_name: track.artist.display_name } : undefined,
            }}
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
          />
        </div>

        {/* Owned Badge */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-sm text-xs font-medium",
          isCurrentlyPlaying 
            ? "bg-accent text-accent-foreground" 
            : "bg-primary/90 text-primary-foreground animate-pulse"
        )}>
          {isCurrentlyPlaying ? "Playing" : "OWNED"}
        </div>
      </div>

      {/* Track Info */}
      <div>
        <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {track.artist?.display_name || "Unknown Artist"}
        </p>
      </div>
    </div>
  );
}
