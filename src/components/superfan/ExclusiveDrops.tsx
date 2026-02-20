import { Lock, Disc3, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatEditions } from "@/lib/formatters";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Track {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  editions_sold: number;
  total_editions: number;
  duration: number | null;
  is_exclusive?: boolean;
}

interface ExclusiveDropsProps {
  tracks: Track[];
  isSubscribed: boolean;
  artistId: string;
  artistName: string;
  ownedTrackIds: string[];
}

export function ExclusiveDrops({ tracks, isSubscribed, artistId, artistName, ownedTrackIds }: ExclusiveDropsProps) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  if (tracks.length === 0) {
    return (
      <div className="glass-card-bordered p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">Exclusive Drops</h3>
        <p className="text-sm text-muted-foreground">No exclusive drops yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="glass-card-bordered p-6">
      <h3 className="text-lg font-bold text-foreground mb-4">Exclusive Drops</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative">
        {tracks.map((track) => {
          const isOwned = ownedTrackIds.includes(track.id);
          const remaining = track.total_editions - track.editions_sold;

          return (
            <div
              key={track.id}
              className={`glass-card p-3 group cursor-pointer hover:bg-primary/10 transition-all duration-300 relative ${
                !isSubscribed ? "select-none" : ""
              }`}
            >
              <div className="aspect-square rounded-lg bg-muted/50 mb-2 relative overflow-hidden">
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className={`absolute inset-0 w-full h-full object-cover ${!isSubscribed ? "blur-sm" : ""}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Disc3 className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}

                {isSubscribed && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      className="rounded-full gradient-accent w-9 h-9"
                      onClick={() =>
                        playTrack({
                          id: track.id,
                          title: track.title,
                          audio_url: track.audio_url,
                          cover_art_url: track.cover_art_url,
                          duration: track.duration,
                          artist: { id: artistId, display_name: artistName },
                        })
                      }
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>
                )}

                {!isSubscribed && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-background/60 flex flex-col items-center justify-center gap-2">
                    <Lock className="w-6 h-6 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Subscribe to unlock</span>
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-foreground text-sm truncate">{track.title}</h4>

              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  Superfan Exclusive
                </Badge>
                {remaining <= 20 && remaining > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent">
                    {remaining} left
                  </Badge>
                )}
                {isOwned && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary">
                    Owned
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-primary">{formatPrice(track.price)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatEditions(track.editions_sold, track.total_editions)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
