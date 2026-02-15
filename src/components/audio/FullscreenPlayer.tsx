import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Loader2, MoreHorizontal, ListMusic, Mic2, Heart, FolderPlus, Download,
  Share2, User, Disc3, Lock, Clock, Mic, MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Link, useNavigate } from "react-router-dom";
import { AudioTrack } from "@/contexts/AudioPlayerContext";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface FullscreenPlayerProps {
  albumId?: string | null;
  open: boolean;
  currentTrack: AudioTrack;
  isPlaying: boolean;
  isBuffering: boolean;
  needsUserGesture: boolean;
  currentTime: number;
  duration: number;
  isPreviewMode: boolean;
  previewTimeRemaining: number;
  currentPreviewLimit: number;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  hasKaraoke: boolean;
  isKaraokeMode: boolean;
  karaokeReady: boolean;
  showLyrics: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  canShuffle: boolean;
  canRepeat: boolean;
  isOwned: boolean;
  togglePlayPause: () => void;
  resumePlayback: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  handleShuffleClick: () => void;
  handleRepeatClick: () => void;
  toggleKaraokeMode: () => void;
  toggleShowLyrics: () => void;
  onClose: () => void;
  onOpenQueue: () => void;
  onOpenCredits: () => void;
  onAddToPlaylist: () => void;
  onDownload: () => void;
}

export function FullscreenPlayer({
  albumId,
  open,
  currentTrack,
  isPlaying,
  isBuffering,
  needsUserGesture,
  currentTime,
  duration,
  isPreviewMode,
  previewTimeRemaining,
  currentPreviewLimit,
  isShuffled,
  repeatMode,
  hasKaraoke,
  isKaraokeMode,
  karaokeReady,
  showLyrics,
  hasNext,
  hasPrevious,
  canShuffle,
  canRepeat,
  isOwned,
  togglePlayPause,
  resumePlayback,
  seek,
  playNext,
  playPrevious,
  handleShuffleClick,
  handleRepeatClick,
  toggleKaraokeMode,
  toggleShowLyrics,
  onClose,
  onOpenQueue,
  onOpenCredits,
  onAddToPlaylist,
  onDownload,
}: FullscreenPlayerProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleGoToArtist = () => {
    setShowMenu(false);
    onClose();
    if (currentTrack.artist?.id) {
      navigate(`/artist/${currentTrack.artist.id}`);
    }
  };

  const handleGoToAlbum = () => {
    setShowMenu(false);
    onClose();
    if (albumId) {
      navigate(`/album/${albumId}`);
    }
  };

  const handleShare = async () => {
    setShowMenu(false);
    const url = `${window.location.origin}/browse?track=${currentTrack.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // silent
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[55] bg-[#141414] flex flex-col overflow-hidden"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            <div className="text-center flex-1 min-w-0 px-4">
              {albumId ? (
                <p className="text-xs text-white/50 uppercase tracking-wider truncate">Playing from Album</p>
              ) : (
                <p className="text-xs text-white/50 uppercase tracking-wider truncate">Now Playing</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setShowMenu(true)}
            >
              <MoreHorizontal className="h-6 w-6" />
            </Button>
          </div>

          {/* Main content area - flex grow with centering */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 min-h-0">
            {/* Cover Art */}
            <div className="w-full max-w-[320px] md:max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-2xl shadow-black/50 flex-shrink-0">
              {currentTrack.cover_art_url ? (
                <img
                  src={currentTrack.cover_art_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Disc3 className="w-20 h-20 text-white/20" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="w-full max-w-[320px] md:max-w-[400px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white truncate flex-1">
                  {currentTrack.title}
                </h2>
                {isPreviewMode && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-500 bg-amber-500/10">
                    <Clock className="w-2.5 h-2.5" />
                    {Math.ceil(previewTimeRemaining)}s
                  </span>
                )}
              </div>
              {currentTrack.artist && (
                <Link
                  to={`/artist/${currentTrack.artist.id}`}
                  className="text-base text-[#B8A675] hover:underline transition-colors"
                  onClick={onClose}
                >
                  {currentTrack.artist.display_name || "Unknown Artist"}
                </Link>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-[320px] md:max-w-[400px] flex-shrink-0">
              <div className="relative">
                <Slider
                  value={[currentTime]}
                  max={isPreviewMode ? currentPreviewLimit : (duration || 100)}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full [&_[role=slider]]:bg-[#B8A675] [&_[role=slider]]:border-[#B8A675] [&_.bg-primary]:bg-[#B8A675]"
                />
                {isPreviewMode && duration > currentPreviewLimit && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-500 pointer-events-none rounded-full"
                    style={{ left: `${(currentPreviewLimit / duration) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-white/50">{formatTime(currentTime)}</span>
                <span className="text-xs text-white/50">
                  {isPreviewMode ? formatTime(currentPreviewLimit) : formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 w-full max-w-[320px] md:max-w-[400px] flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 relative",
                  isShuffled && canShuffle ? "text-[#B8A675]" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
                onClick={handleShuffleClick}
              >
                <Shuffle className="h-5 w-5" />
                {!canShuffle && <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-[#B8A675]" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-white/80 hover:text-white hover:bg-white/10"
                onClick={playPrevious}
                disabled={!hasPrevious}
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                className="rounded-full w-16 h-16 bg-white text-[#141414] hover:bg-white/90 shadow-lg flex-shrink-0"
                onClick={needsUserGesture ? resumePlayback : togglePlayPause}
                disabled={isBuffering && !needsUserGesture}
              >
                {isBuffering && !needsUserGesture ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7" />
                ) : (
                  <Play className="h-7 w-7 ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-white/80 hover:text-white hover:bg-white/10"
                onClick={playNext}
                disabled={!hasNext}
              >
                <SkipForward className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 relative",
                  repeatMode !== "off" && canRepeat ? "text-[#B8A675]" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
                onClick={handleRepeatClick}
              >
                {repeatMode === "one" && canRepeat ? (
                  <Repeat1 className="h-5 w-5" />
                ) : (
                  <Repeat className="h-5 w-5" />
                )}
                {!canRepeat && <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-[#B8A675]" />}
              </Button>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-center gap-4 w-full max-w-[320px] md:max-w-[400px] flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white/60 hover:text-[#B8A675] hover:bg-white/10"
                onClick={onOpenCredits}
                title="View credits"
              >
                <Mic2 className="h-5 w-5" />
              </Button>

              {hasKaraoke && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10",
                    isKaraokeMode ? "text-[#B8A675] bg-[#B8A675]/10" : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  onClick={toggleKaraokeMode}
                  disabled={!karaokeReady}
                  title={isKaraokeMode ? "Original audio" : "Karaoke mode"}
                >
                  {isKaraokeMode ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}

              {isOwned && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/60 hover:text-[#B8A675] hover:bg-white/10"
                  onClick={onAddToPlaylist}
                  title="Add to playlist"
                >
                  <FolderPlus className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white/60 hover:text-[#B8A675] hover:bg-white/10"
                onClick={onDownload}
                title="Download"
              >
                <Download className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white/60 hover:text-[#B8A675] hover:bg-white/10"
                onClick={onOpenQueue}
                title="Queue"
              >
                <ListMusic className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* "..." Menu Drawer */}
          <Drawer open={showMenu} onOpenChange={setShowMenu}>
            <DrawerContent className="z-[60] bg-[#1c1c1c] border-white/10">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Track Options</DrawerTitle>
                <DrawerDescription>Actions for {currentTrack.title}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 pt-2 space-y-1">
                {/* Track info header */}
                <div className="flex items-center gap-3 p-3 mb-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {currentTrack.cover_art_url ? (
                      <img src={currentTrack.cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                    <p className="text-xs text-white/50 truncate">
                      {currentTrack.artist?.display_name || "Unknown Artist"}
                    </p>
                  </div>
                </div>

                <MenuButton icon={FolderPlus} label="Add to Playlist" onClick={() => { setShowMenu(false); onAddToPlaylist(); }} />
                {currentTrack.artist?.id && (
                  <MenuButton icon={User} label="Go to Artist" onClick={handleGoToArtist} />
                )}
                {albumId && (
                  <MenuButton icon={Disc3} label="Go to Album" onClick={handleGoToAlbum} />
                )}
                <MenuButton icon={Mic2} label="View Credits" onClick={() => { setShowMenu(false); onOpenCredits(); }} />
                <MenuButton icon={Download} label="Download" onClick={() => { setShowMenu(false); onDownload(); }} />
                <MenuButton icon={Share2} label="Share (Copy Link)" onClick={handleShare} />
              </div>
            </DrawerContent>
          </Drawer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors text-left"
      onClick={onClick}
    >
      <Icon className="h-5 w-5 text-white/50" />
      <span className="text-sm">{label}</span>
    </button>
  );
}
