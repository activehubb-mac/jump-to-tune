import { Play, Pin, Download, Music, ListMusic, User, Disc3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export type LibraryItemType = "playlist" | "album" | "artist" | "track" | "liked-songs";

interface LibraryListItemProps {
  id: string;
  title: string;
  subtitle: string;
  type: LibraryItemType;
  imageUrl?: string | null;
  trackCount?: number;
  isPinned?: boolean;
  isDownloaded?: boolean;
  isOwned?: boolean;
  linkTo?: string;
  // For direct playback (tracks)
  audioData?: {
    audio_url: string;
    duration: number | null;
    artist?: {
      id: string;
      display_name: string | null;
    };
  };
  onClick?: () => void;
}

export function LibraryListItem({
  id,
  title,
  subtitle,
  type,
  imageUrl,
  trackCount,
  isPinned,
  isDownloaded,
  isOwned,
  linkTo,
  audioData,
  onClick,
}: LibraryListItemProps) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  
  const isCurrentlyPlaying = currentTrack?.id === id && isPlaying;

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Direct playback for owned tracks only (not playlists, albums, artists, liked-songs)
    if (audioData && type === "track" && isOwned) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {}
      
      playTrack({
        id,
        title,
        audio_url: audioData.audio_url,
        cover_art_url: imageUrl,
        duration: audioData.duration,
        artist: audioData.artist,
      });
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "playlist":
      case "liked-songs":
        return <ListMusic className="w-3 h-3" />;
      case "album":
        return <Disc3 className="w-3 h-3" />;
      case "artist":
        return <User className="w-3 h-3" />;
      case "track":
        return <Music className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "playlist":
        return "Playlist";
      case "album":
        return "Album";
      case "artist":
        return "Artist";
      case "track":
        return "Track";
      case "liked-songs":
        return "Playlist";
      default:
        return "";
    }
  };

  // Liked Songs has special gradient background
  const isLikedSongs = type === "liked-songs";

  const content = (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "hover:bg-muted/30 active:scale-[0.98]",
        "touch-manipulation select-none cursor-pointer",
        isCurrentlyPlaying && "bg-primary/10"
      )}
      onClick={handleClick}
    >
      {/* Cover Art */}
      <div className={cn(
        "relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden",
        type === "artist" && "rounded-full",
        isOwned && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
      )}>
        {isLikedSongs ? (
          <div className="w-full h-full bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            {type === "artist" ? (
              <User className="w-6 h-6 text-muted-foreground/50" />
            ) : type === "album" ? (
              <Disc3 className="w-6 h-6 text-muted-foreground/50" />
            ) : (
              <ListMusic className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>
        )}
        
        {/* Playing indicator overlay */}
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="w-6 h-6 flex items-center justify-center gap-0.5">
              <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-primary rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold text-base text-foreground truncate",
          isCurrentlyPlaying && "text-primary"
        )}>
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {/* Status Icons */}
          {isPinned && (
            <Pin className="w-3 h-3 text-primary flex-shrink-0" />
          )}
          {isDownloaded && (
            <Download className="w-3 h-3 text-primary flex-shrink-0" />
          )}
          
          {/* Type label */}
          <span className="truncate">
            {getTypeLabel()}
            {subtitle && ` • ${subtitle}`}
            {trackCount !== undefined && ` • ${trackCount} songs`}
          </span>
        </div>
      </div>
    </div>
  );

  // Wrap in Link if we have a destination and it's not a direct playback owned track
  if (linkTo && !(audioData && type === "track" && isOwned)) {
    return (
      <Link to={linkTo} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
