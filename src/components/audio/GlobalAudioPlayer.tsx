import { Play, Pause, Volume2, VolumeX, X, Disc3, Loader2, SkipBack, SkipForward, ListMusic, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAudioKeyboardShortcuts } from "@/hooks/useAudioKeyboardShortcuts";
import { Link } from "react-router-dom";
import { useState } from "react";

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
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isPlayerVisible,
    queue,
    queueIndex,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
  } = useAudioPlayer();

  const [showQueue, setShowQueue] = useState(false);

  // Enable keyboard shortcuts
  useAudioKeyboardShortcuts();

  if (!isPlayerVisible || !currentTrack) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const hasNext = queueIndex < queue.length - 1 || repeatMode === "all";
  const hasPrevious = queueIndex > 0 || currentTime > 3;

  return (
    <>
      {/* Queue Panel */}
      {showQueue && (
        <div className="fixed bottom-20 md:bottom-16 right-4 z-50 w-80 max-h-96 glass-card border border-glass-border/30 backdrop-blur-xl rounded-lg overflow-hidden animate-in slide-in-from-bottom duration-200">
          <div className="p-3 border-b border-glass-border/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Up Next</h3>
              <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-72">
            {queue.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Queue is empty
              </div>
            ) : (
              queue.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={`flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                    index === queueIndex ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0">
                    {track.cover_art_url ? (
                      <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${index === queueIndex ? "text-primary font-medium" : "text-foreground"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist?.display_name || "Unknown Artist"}
                    </p>
                  </div>
                  {index === queueIndex && (
                    <div className="flex-shrink-0">
                      {isPlaying ? (
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                          <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse delay-75" />
                          <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse delay-150" />
                        </div>
                      ) : (
                        <Play className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Player Bar */}
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
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isShuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={toggleShuffle}
                  title={isShuffled ? "Shuffle on" : "Shuffle off"}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={playPrevious}
                  disabled={!hasPrevious}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  className="rounded-full w-10 h-10 gradient-accent neon-glow-subtle flex-shrink-0"
                  onClick={togglePlayPause}
                  disabled={isBuffering}
                >
                  {isBuffering ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={playNext}
                  disabled={!hasNext}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={cycleRepeatMode}
                  title={repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one"}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
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
            <div className="flex items-center gap-1 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={playPrevious}
                disabled={!hasPrevious}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="rounded-full w-10 h-10 gradient-accent neon-glow-subtle flex-shrink-0"
                onClick={togglePlayPause}
                disabled={isBuffering}
              >
                {isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={playNext}
                disabled={!hasNext}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume, Queue & Close */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setShowQueue(!showQueue)}
              >
                <ListMusic className="h-4 w-4" />
                {queue.length > 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>

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
    </>
  );
}
