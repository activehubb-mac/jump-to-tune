import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Loader2, MoreHorizontal, ListMusic, Mic2, Heart, FolderPlus, Download,
  Share2, User, Disc3, Lock, Clock, Mic, MicOff, ChevronRight, Shield, UserPlus, UserCheck,
  Type,
} from "lucide-react";
import { LyricsDisplay } from "@/components/sing-mode/LyricsDisplay";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { AudioTrack } from "@/contexts/AudioPlayerContext";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useFollow } from "@/hooks/useFollows";

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
  lyrics: string | null;
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
  onPlayTrack?: (track: AudioTrack) => void;
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
  onPlayTrack,
}: FullscreenPlayerProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const [bioExpanded, setBioExpanded] = useState(false);
  const { isFollowing, toggleFollow, isToggling } = useFollow();

  const artistId = currentTrack.artist?.id;
  const trackId = currentTrack.id;

  // Fetch artist profile (banner, bio, etc.)
  const { data: artistProfile } = useQuery({
    queryKey: ["fullscreen-artist-profile", artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const { data } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url, banner_image_url, bio")
        .eq("id", artistId)
        .maybeSingle();
      return data;
    },
    enabled: open && !!artistId,
  });

  // Fetch follower count
  const { data: followerCount } = useQuery({
    queryKey: ["fullscreen-follower-count", artistId],
    queryFn: async () => {
      if (!artistId) return 0;
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", artistId);
      return count || 0;
    },
    enabled: open && !!artistId,
  });

  // Fetch more tracks from this artist
  const { data: artistTracks, isLoading: loadingArtistTracks } = useQuery({
    queryKey: ["fullscreen-artist-tracks", artistId, trackId],
    queryFn: async () => {
      if (!artistId) return [];
      const { data } = await supabase
        .from("tracks")
        .select("id, title, cover_art_url, audio_url, duration, price, has_karaoke, preview_duration, artist:profiles_public!tracks_artist_id_fkey(id, display_name, avatar_url)")
        .eq("artist_id", artistId)
        .neq("id", trackId)
        .eq("is_draft", false)
        .limit(10);
      return data || [];
    },
    enabled: open && !!artistId,
  });


  // Fetch track registration
  const { data: trackRegistration } = useQuery({
    queryKey: ["fullscreen-track-registration", trackId],
    queryFn: async () => {
      const { data } = await supabase
        .from("track_registrations")
        .select("recording_id")
        .eq("track_id", trackId)
        .maybeSingle();
      return data;
    },
    enabled: open,
  });


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

  const handlePlayRelatedTrack = (track: any) => {
    if (onPlayTrack) {
      const audioTrack: AudioTrack = {
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        price: track.price,
        has_karaoke: track.has_karaoke,
        preview_duration: track.preview_duration,
        artist: Array.isArray(track.artist) ? track.artist[0] : track.artist,
      };
      onPlayTrack(audioTrack);
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

          {/* Scrollable content area */}
          <div
            className="flex-1 overflow-y-auto min-h-0"
            style={{
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Main player content - centered */}
            <div className="flex flex-col items-center px-8 gap-6 pt-2 pb-4">
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
              <div className="w-full max-w-[320px] md:max-w-[400px]">
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
              <div className="w-full max-w-[320px] md:max-w-[400px]">
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
              <div className="flex items-center justify-center gap-6 w-full max-w-[320px] md:max-w-[400px]">
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
              <div className="flex items-center justify-center gap-4 w-full max-w-[320px] md:max-w-[400px]">
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

            {/* === Scrollable Extra Content === */}
            <div className="px-6 pb-8 space-y-8">

              {/* More from this Artist */}
              {artistId && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white/80">
                      More from {currentTrack.artist?.display_name || "this artist"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-white/40 hover:text-white/70 h-7 px-2"
                      onClick={() => {
                        onClose();
                        navigate(`/artist/${artistId}`);
                      }}
                    >
                      See all <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>

                  {loadingArtistTracks ? (
                    <div className="flex gap-3 overflow-hidden">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 w-32">
                          <Skeleton className="w-32 h-32 rounded-lg bg-white/5" />
                          <Skeleton className="w-24 h-3 mt-2 bg-white/5" />
                        </div>
                      ))}
                    </div>
                  ) : artistTracks && artistTracks.length > 0 ? (
                    <div
                      className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {artistTracks.map((track) => (
                        <button
                          key={track.id}
                          className="flex-shrink-0 w-32 text-left group"
                          onClick={() => handlePlayRelatedTrack(track)}
                        >
                          <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/5 relative">
                            {track.cover_art_url ? (
                              <img
                                src={track.cover_art_url}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Disc3 className="w-8 h-8 text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <p className="text-xs text-white/70 mt-2 truncate group-hover:text-white transition-colors">
                            {track.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30">No other tracks available</p>
                  )}
                </div>
              )}

              {/* View Song Credits Button */}
              <button
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                onClick={onOpenCredits}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mic2 className="h-5 w-5 text-[#B8A675]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">View Song Credits</p>
                  <p className="text-xs text-white/40">Writers, producers & more</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />
              </button>

              {/* Rich About the Artist Section */}
              {artistId && artistProfile && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-3">About the Artist</h3>

                  {/* Banner Image */}
                  <div className="relative w-full h-[200px] rounded-xl overflow-hidden bg-white/5">
                    {artistProfile.banner_image_url ? (
                      <img
                        src={artistProfile.banner_image_url}
                        alt={artistProfile.display_name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : artistProfile.avatar_url ? (
                      <img
                        src={artistProfile.avatar_url}
                        alt={artistProfile.display_name || ""}
                        className="w-full h-full object-cover scale-150 blur-sm"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                        <User className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Artist name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-xl font-bold text-white drop-shadow-lg">
                        {artistProfile.display_name || "Unknown Artist"}
                      </h4>
                    </div>
                  </div>

                  {/* Follower count + Follow button */}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-white/50">
                      {followerCount !== undefined
                        ? `${followerCount.toLocaleString()} follower${followerCount !== 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <Button
                      size="sm"
                      variant={isFollowing(artistId) ? "outline" : "default"}
                      className={cn(
                        "h-8 px-4 text-xs font-semibold rounded-full",
                        isFollowing(artistId)
                          ? "border-white/20 text-white/80 hover:bg-white/10 bg-transparent"
                          : "bg-[#B8A675] text-black hover:bg-[#B8A675]/90"
                      )}
                      onClick={() => toggleFollow(artistId, artistProfile.display_name || undefined)}
                      disabled={isToggling}
                    >
                      {isFollowing(artistId) ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Bio */}
                  {artistProfile.bio && (
                    <div className="mt-3">
                      <p
                        className={cn(
                          "text-sm text-white/60 leading-relaxed whitespace-pre-line",
                          !bioExpanded && "line-clamp-3"
                        )}
                      >
                        {artistProfile.bio}
                      </p>
                      {artistProfile.bio.length > 120 && (
                        <button
                          className="text-xs text-[#B8A675] mt-1 hover:underline"
                          onClick={() => setBioExpanded(!bioExpanded)}
                        >
                          {bioExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* JumTunes Recording ID */}
              {trackRegistration?.recording_id && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Shield className="h-4 w-4 text-[#B8A675] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40">JumTunes Recording ID</p>
                    <p className="text-xs text-white/60 font-mono">{trackRegistration.recording_id}</p>
                  </div>
                </div>
              )}
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
