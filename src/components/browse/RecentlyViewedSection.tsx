import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed, RecentlyViewedTrack } from "@/hooks/useRecentlyViewed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatPrice } from "@/lib/formatters";

interface RecentlyViewedSectionProps {
  onTrackClick?: (track: RecentlyViewedTrack) => void;
}

export function RecentlyViewedSection({ onTrackClick }: RecentlyViewedSectionProps) {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed(5);
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recently Viewed
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {recentlyViewed.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-40 glass-card p-3 group cursor-pointer hover:bg-primary/10 transition-all"
              onClick={() => onTrackClick?.(track)}
            >
              <div className="aspect-square rounded-md bg-muted/50 mb-2 relative overflow-hidden">
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    className="rounded-full gradient-accent w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Use pre-hydrated audio_url for Safari gesture chain compatibility
                      playTrack({
                        id: track.id,
                        title: track.title,
                        audio_url: track.audio_url,
                        cover_art_url: track.cover_art_url,
                        duration: track.duration,
                        price: track.price,
                        artist: {
                          id: track.artist_id,
                          display_name: track.artist_name,
                        },
                      });
                    }}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
              <h4 className="text-sm font-medium text-foreground truncate">{track.title}</h4>
              <Link
                to={`/artist/${track.artist_id}`}
                className="text-xs text-muted-foreground truncate block hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {track.artist_name || "Unknown Artist"}
              </Link>
              <span className="text-xs font-medium text-primary mt-1 block">
                {formatPrice(track.price)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
