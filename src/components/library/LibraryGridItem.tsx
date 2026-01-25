import { Link } from "react-router-dom";
import { Heart, Download, Music, User, Disc3, ListMusic, Pin, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { LibraryItem } from "@/hooks/useLibraryItems";
import { Button } from "@/components/ui/button";

interface LibraryGridItemProps {
  item: LibraryItem;
  onClick?: () => void;
}

export function LibraryGridItem({ item, onClick }: LibraryGridItemProps) {
  const isLikedSongs = item.type === "liked-songs";

  const ImageContent = () => {
    if (isLikedSongs) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div>
      );
    }

    if (item.imageUrl) {
      return (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      );
    }

    const IconComponent = {
      playlist: ListMusic,
      album: Disc3,
      artist: User,
      track: Music,
      "liked-songs": Heart,
    }[item.type];

    return (
      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
        <IconComponent className="w-12 h-12 text-muted-foreground/50" />
      </div>
    );
  };

  return (
    <Link
      to={item.linkTo}
      onClick={onClick}
      className="group"
    >
      <div className="glass-card p-4 hover:bg-primary/10 transition-all duration-300">
        {/* Image */}
        <div
          className={cn(
            "aspect-square mb-4 overflow-hidden shadow-lg relative",
            item.imageShape === "rounded" ? "rounded-full mx-auto w-32 h-32" : "rounded-md"
          )}
        >
          <ImageContent />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              className="w-12 h-12 rounded-full gradient-accent shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
          </div>

          {/* Badges */}
          {item.isPinned && (
            <div className="absolute top-2 left-2 p-1.5 rounded-full bg-primary/80 backdrop-blur-sm">
              <Pin className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
            </div>
          )}
          {item.isDownloaded && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-green-500/80 backdrop-blur-sm">
              <Download className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn(item.imageShape === "rounded" ? "text-center" : "")}>
          <h3 className="font-semibold text-foreground truncate text-sm mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {item.subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}
