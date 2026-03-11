import { Play, Pause, Heart, ListPlus, Mic2 } from "lucide-react";
import { Disc3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SpotifyTrackCardProps {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  coverArtUrl: string | null;
  audioUrl: string;
  duration?: number | null;
  price?: number;
  hasKaraoke?: boolean;
  isPlaying?: boolean;
  isCurrentTrack?: boolean;
  isLiked?: boolean;
  onPlay: () => void;
  onLike: () => void;
  onAddToPlaylist: () => void;
  onKaraoke?: () => void;
  onClick?: () => void;
  artist?: { id?: string; display_name?: string | null; avatar_url?: string | null };
}

export function SpotifyTrackCard({
  id,
  title,
  artistName,
  artistId,
  coverArtUrl,
  isPlaying,
  isCurrentTrack,
  isLiked,
  hasKaraoke,
  onPlay,
  onLike,
  onAddToPlaylist,
  onKaraoke,
  onClick,
}: SpotifyTrackCardProps) {
  return (
    <div
      className="group relative rounded-md bg-card hover:bg-muted p-3 transition-all duration-300 cursor-pointer track-card-3d"
      onClick={onClick}
    >
      {/* Cover Art */}
      <div className="aspect-square rounded-md bg-muted/50 mb-3 relative overflow-hidden shadow-lg">
        {coverArtUrl ? (
          <img
            src={coverArtUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Disc3 className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

        {/* Play Button - Bottom Right */}
        <button
          className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
            "bg-primary text-primary-foreground",
            "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
            isCurrentTrack && isPlaying && "opacity-100 translate-y-0"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Like Button - Top Right */}
        <button
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            isLiked
              ? "opacity-100 text-primary"
              : "text-foreground hover:text-primary"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </button>

        {/* Add to Playlist - Top Left */}
        <button
          className="absolute top-2 left-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 text-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist();
          }}
          title="Add to playlist"
        >
          <ListPlus className="w-4 h-4" />
        </button>

        {/* Karaoke Button - Bottom Left */}
        {hasKaraoke && onKaraoke && (
          <button
            className="absolute bottom-2 left-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 text-accent hover:text-primary bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onKaraoke();
            }}
            title="Karaoke"
          >
            <Mic2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Track Info - Minimal */}
      <div className="min-w-0">
        <h3 className="font-medium text-foreground text-sm truncate leading-tight">
          {title}
        </h3>
        <Link
          to={artistId ? `/artist/${artistId}` : "#"}
          className="text-xs text-muted-foreground truncate block mt-1 hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {artistName}
        </Link>
      </div>
    </div>
  );
}
