import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Edit, Trash2, Play, Pause, ListPlus, Lock, Mic2 } from "lucide-react";
import { formatPrice, formatEditions } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { DownloadButton } from "@/components/download/DownloadButton";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    description?: string | null;
    cover_art_url: string | null;
    audio_url?: string;
    price: number;
    editions_sold: number;
    total_editions: number;
    genre?: string | null;
    moods?: string[] | null;
    duration?: number | null;
    is_explicit?: boolean;
    has_karaoke?: boolean;
    artist?: {
      id: string;
      display_name: string | null;
    };
    featuredArtists?: {
      id: string;
      display_name: string | null;
    }[];
  };
  showArtist?: boolean;
  showActions?: boolean;
  showPlayButton?: boolean;
  onEdit?: (trackId: string) => void;
  onDelete?: (trackId: string) => void;
  onClick?: () => void;
}

export const TrackCard = React.forwardRef<HTMLDivElement, TrackCardProps>(
  function TrackCard(
    {
      track,
      showArtist = false,
      showActions = false,
      showPlayButton = false,
      onEdit,
      onDelete,
      onClick,
    },
    ref
  ) {
    const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
    const { canUseFeature } = useFeatureGate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    
    const isCurrentTrack = currentTrack?.id === track.id;
    
    const handlePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      playTrack({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url || "",
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        artist: track.artist,
      });
    };
    
    const handleAddToQueue = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!canUseFeature("addToQueue")) {
        setShowPremiumModal(true);
        return;
      }
      
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url || "",
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        artist: track.artist,
      });
    };

    return (
      <>
        <PremiumFeatureModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
          feature="Add to Queue"
        />
        
        <div
          ref={ref}
          className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
          onClick={onClick}
        >
          {/* Album Art */}
          <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
            {track.cover_art_url ? (
              <img
                src={track.cover_art_url}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}

            {/* Badges - Top Left */}
            <div className="absolute top-2 left-2 flex gap-1">
              {track.is_explicit && (
                <Badge 
                  variant="destructive" 
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  E
                </Badge>
              )}
              {track.has_karaoke && (
                <Badge 
                  className="text-[10px] px-1.5 py-0 h-5 bg-primary/90 hover:bg-primary text-primary-foreground gap-0.5"
                  title="Karaoke available"
                >
                  <Mic2 className="w-3 h-3" />
                </Badge>
              )}
            </div>

            {/* Play overlay for fan-facing cards */}
            {showPlayButton && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  className="rounded-full gradient-accent w-10 h-10"
                  onClick={handlePlay}
                >
                  {isCurrentTrack && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50 relative"
                  onClick={handleAddToQueue}
                  title={canUseFeature("addToQueue") ? "Add to queue" : "Premium feature"}
                >
                  <ListPlus className="w-4 h-4" />
                  {!canUseFeature("addToQueue") && (
                    <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
                  )}
                </Button>
                <DownloadButton
                  track={{
                    id: track.id,
                    title: track.title,
                    cover_art_url: track.cover_art_url,
                    price: track.price,
                    audio_url: track.audio_url || "",
                    artist: track.artist ? { display_name: track.artist.display_name } : undefined,
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
                />
              </div>
            )}

            {/* Actions for owner - Edit and Delete only */}
            {showActions && (
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(track.id);
                  }}
                  className="p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  title="Edit track"
                >
                  <Edit className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(track.id);
                  }}
                  className="p-2 rounded-full bg-destructive/80 backdrop-blur-sm hover:bg-destructive transition-colors"
                  title="Delete track"
                >
                  <Trash2 className="w-4 h-4 text-destructive-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div>
            <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
            {showArtist && track.artist && (
              <Link
                to={`/artist/${track.artist.id}`}
                className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                onClick={(e) => e.stopPropagation()}
              >
                {track.artist.display_name || "Unknown Artist"}
                {track.featuredArtists && track.featuredArtists.length > 0 && (
                  <span className="text-muted-foreground/70">
                    {" feat. "}
                    {track.featuredArtists.map((a) => a.display_name).join(", ")}
                  </span>
                )}
              </Link>
            )}
            {!showArtist && track.genre && (
              <p className="text-sm text-muted-foreground truncate">{track.genre}</p>
            )}
            {/* Mood Tags */}
            {track.moods && track.moods.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {track.moods.slice(0, 3).map((mood) => (
                  <span
                    key={mood}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-accent-foreground/80"
                  >
                    {mood}
                  </span>
                ))}
                {track.moods.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{track.moods.length - 3}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
              <span className="text-xs text-muted-foreground">
                {formatEditions(track.editions_sold, track.total_editions)}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }
);

TrackCard.displayName = "TrackCard";
