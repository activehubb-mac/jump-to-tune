import { Play, Pause, Volume2, VolumeX, X, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Link } from "react-router-dom";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isPlayerVisible,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
  } = useAudioPlayer();

  if (!isPlayerVisible || !currentTrack) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-glass-border/30 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-64">
            <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
              {currentTrack.cover_art_url ? (
                <img
                  src={currentTrack.cover_art_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentTrack.title}
              </p>
              {currentTrack.artist && (
                <Link
                  to={`/artist/${currentTrack.artist.id}`}
                  className="text-xs text-muted-foreground truncate block hover:text-primary transition-colors"
                >
                  {currentTrack.artist.display_name || "Unknown Artist"}
                </Link>
              )}
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto hidden md:flex">
            {/* Play Button & Progress */}
            <div className="flex items-center gap-3 w-full">
              <Button
                size="icon"
                className="rounded-full w-10 h-10 gradient-accent neon-glow-subtle flex-shrink-0"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1 cursor-pointer"
              />
              
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Mobile Play Button */}
          <Button
            size="icon"
            className="rounded-full w-10 h-10 gradient-accent neon-glow-subtle flex-shrink-0 md:hidden"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Volume & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
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
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={closePlayer}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden pb-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
