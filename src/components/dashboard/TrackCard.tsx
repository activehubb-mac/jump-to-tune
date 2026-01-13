import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Disc3, Play, Heart, Edit, Trash2 } from "lucide-react";
import { formatPrice, formatEditions } from "@/lib/formatters";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    price: number;
    editions_sold: number;
    total_editions: number;
    genre?: string | null;
    artist?: {
      id: string;
      display_name: string | null;
    };
  };
  showArtist?: boolean;
  showActions?: boolean;
  onEdit?: (trackId: string) => void;
  onDelete?: (trackId: string) => void;
}

export function TrackCard({
  track,
  showArtist = false,
  showActions = false,
  onEdit,
  onDelete,
}: TrackCardProps) {
  return (
    <div className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
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
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="icon" className="rounded-full gradient-accent neon-glow w-12 h-12">
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
        
        {/* Like Button */}
        <button className="absolute top-2 right-2 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80">
          <Heart className="w-4 h-4 text-foreground" />
        </button>

        {/* Actions for owner */}
        {showActions && (
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(track.id);
              }}
              className="p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
            >
              <Edit className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(track.id);
              }}
              className="p-2 rounded-full bg-destructive/50 backdrop-blur-sm hover:bg-destructive/80"
            >
              <Trash2 className="w-4 h-4 text-foreground" />
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
          </Link>
        )}
        {!showArtist && track.genre && (
          <p className="text-sm text-muted-foreground truncate">{track.genre}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
          <span className="text-xs text-muted-foreground">
            {formatEditions(track.editions_sold, track.total_editions)}
          </span>
        </div>
      </div>
    </div>
  );
}
