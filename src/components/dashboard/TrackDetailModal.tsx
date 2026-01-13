import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Disc3, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { formatPrice, formatEditions } from "@/lib/formatters";
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  title: string;
  description?: string | null;
  cover_art_url: string | null;
  audio_url: string;
  price: number;
  editions_sold: number;
  total_editions: number;
  genre?: string | null;
  duration?: number | null;
  artist?: {
    id: string;
    display_name: string | null;
  };
}

interface TrackDetailModalProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrackDetailModal({
  track,
  open,
  onOpenChange,
}: TrackDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Reset player state when modal closes or track changes
  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [open, track?.id]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">{track.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6">
          {/* Cover Art */}
          <div className="w-full aspect-square max-w-[280px] rounded-xl overflow-hidden bg-muted/50 relative">
            {track.cover_art_url ? (
              <img
                src={track.cover_art_url}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Disc3 className="w-24 h-24 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold text-foreground mb-1">{track.title}</h2>
            {track.artist && (
              <p className="text-muted-foreground">
                {track.artist.display_name || "Unknown Artist"}
              </p>
            )}
            {track.genre && (
              <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-primary/20 text-primary">
                {track.genre}
              </span>
            )}
          </div>

          {/* Description */}
          {track.description && (
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {track.description}
            </p>
          )}

          {/* Price & Editions */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Price</p>
              <p className="font-semibold text-primary">{formatPrice(track.price)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-muted-foreground">Editions</p>
              <p className="font-semibold text-foreground">
                {formatEditions(track.editions_sold, track.total_editions)}
              </p>
            </div>
          </div>

          {/* Audio Player */}
          <div className="w-full space-y-3 glass-card p-4 rounded-xl">
            <audio
              ref={audioRef}
              src={track.audio_url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
            />

            {/* Progress Bar */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />

            {/* Time Display */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>

              {/* Play/Pause Button */}
              <Button
                size="lg"
                className="rounded-full w-14 h-14 gradient-accent neon-glow-subtle"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              {/* Spacer for symmetry */}
              <div className="w-[108px]" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
