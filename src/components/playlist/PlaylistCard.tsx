import { Link } from "react-router-dom";
import { Play, Shuffle, MoreVertical, Trash2, Edit, ListMusic, Sparkles, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Playlist } from "@/hooks/usePlaylists";

interface PlaylistCardProps {
  playlist?: Playlist;
  name?: string;
  icon?: React.ReactNode;
  trackCount?: number;
  isSpecial?: boolean;
  href?: string;
  onPlay?: () => void;
  onShuffle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlaylistCard({
  playlist,
  name,
  icon,
  trackCount,
  isSpecial = false,
  href,
  onPlay,
  onShuffle,
  onEdit,
  onDelete,
}: PlaylistCardProps) {
  const displayName = playlist?.name || name || "Untitled";
  const displayCount = playlist?.track_count ?? trackCount ?? 0;
  const coverTracks = playlist?.cover_tracks || [];
  const linkTo = href || (playlist ? `/library/playlist/${playlist.id}` : "#");

  // Generate mosaic cover from first 4 tracks
  const renderCover = () => {
    if (icon) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          {icon}
        </div>
      );
    }

    if (coverTracks.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <ListMusic className="w-12 h-12 text-muted-foreground/50" />
        </div>
      );
    }

    if (coverTracks.length === 1) {
      return coverTracks[0].cover_art_url ? (
        <img
          src={coverTracks[0].cover_art_url}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Disc3 className="w-12 h-12 text-muted-foreground/50" />
        </div>
      );
    }

    // 2x2 mosaic for 2-4 tracks
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {[0, 1, 2, 3].map((i) => {
          const track = coverTracks[i] || coverTracks[i % coverTracks.length];
          return track?.cover_art_url ? (
            <img
              key={i}
              src={track.cover_art_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div key={i} className="w-full h-full bg-muted/50 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-muted-foreground/30" />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Link
      to={linkTo}
      className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300 block"
    >
      {/* Cover Art */}
      <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
        {renderCover()}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className="rounded-full gradient-accent neon-glow w-10 h-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay?.();
            }}
          >
            <Play className="w-4 h-4 ml-0.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShuffle?.();
            }}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>

        {/* Special badge */}
        {isSpecial && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-medium text-primary-foreground flex items-center gap-1">
            {icon && <span className="w-3 h-3">{icon}</span>}
            Auto
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
          <p className="text-sm text-muted-foreground">
            {displayCount} {displayCount === 1 ? "track" : "tracks"}
          </p>
        </div>

        {/* Actions menu for user playlists */}
        {!isSpecial && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Link>
  );
}
