import { Link } from "react-router-dom";
import { Heart, Music, User, Disc3, ListMusic, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { LibraryItem } from "@/hooks/useLibraryItems";

interface LibraryListItemProps {
  item: LibraryItem;
  onClick?: () => void;
}

export function LibraryListItem({ item, onClick }: LibraryListItemProps) {
  const isLikedSongs = item.type === "liked-songs";
  const isDownloadedTrack = item.type === "track" && item.isDownloaded;

  const ImageContent = () => {
    if (isLikedSongs) {
      // Special gradient for liked songs
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-white" />
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

    // Fallback icon based on type
    const IconComponent = {
      playlist: ListMusic,
      album: Disc3,
      artist: User,
      track: Music,
      "liked-songs": Heart,
    }[item.type];

    return (
      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
        <IconComponent className="w-6 h-6 text-muted-foreground/50" />
      </div>
    );
  };

  // For downloaded tracks, we render a div with onClick to play instead of Link
  if (isDownloadedTrack) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors group cursor-pointer"
      >
        {/* Image with futuristic owned indicator */}
        <div
          className={cn(
            "w-12 h-12 shrink-0 overflow-hidden shadow-sm relative",
            item.imageShape === "rounded" ? "rounded-full" : "rounded-md"
          )}
        >
          <ImageContent />
          {/* Futuristic owned glow ring */}
          <div className="absolute inset-0 rounded-[inherit] ring-2 ring-primary/60 ring-offset-1 ring-offset-background/50" />
          <div className="absolute -inset-0.5 rounded-[inherit] bg-gradient-to-tr from-primary/30 via-transparent to-accent/30 opacity-60" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate text-sm">
              {item.title}
            </h3>
            {/* Futuristic "OWNED" badge */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
              Owned
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.linkTo}
      onClick={onClick}
      className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors group"
    >
      {/* Image */}
      <div
        className={cn(
          "w-12 h-12 shrink-0 overflow-hidden shadow-sm",
          item.imageShape === "rounded" ? "rounded-full" : "rounded-md"
        )}
      >
        <ImageContent />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground truncate text-sm">
            {item.title}
          </h3>
          {item.isPinned && (
            <Pin className="w-3 h-3 text-primary shrink-0 fill-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
      </div>
    </Link>
  );
}
