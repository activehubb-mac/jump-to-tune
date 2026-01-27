import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, X, Disc3, Loader2, SkipBack, SkipForward, ListMusic, Shuffle, Repeat, Repeat1, Trash2, GripVertical, Crown, Lock, Download, Mic, MicOff, Mic2, AudioWaveform, Clock, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAudioPlayer, AudioTrack } from "@/contexts/AudioPlayerContext";
import { useAudioKeyboardShortcuts } from "@/hooks/useAudioKeyboardShortcuts";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { KaraokeLyricsPanel } from "@/components/audio/KaraokeLyricsPanel";
import { UrlWaveformVisualizer } from "@/components/audio/UrlWaveformVisualizer";
import { MiniFrequencyVisualizer } from "@/components/audio/MiniFrequencyVisualizer";
import { PreviewEndedModal } from "@/components/audio/PreviewEndedModal";
import { useKaraokeData, getInstrumentalUrl } from "@/hooks/useKaraokeData";
import { Link } from "react-router-dom";
import { DownloadButton } from "@/components/download/DownloadButton";
import { usePurchases } from "@/hooks/usePurchases";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface SortableTrackItemProps {
  track: AudioTrack;
  actualIndex: number;
  onPlay: () => void;
  onRemove: () => void;
}

function SortableTrackItem({ track, actualIndex, onPlay, onRemove }: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${track.id}-${actualIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div
        className="flex items-center gap-3 flex-1 min-w-0"
        onClick={onPlay}
      >
        <div className="w-8 h-8 rounded bg-muted/50 overflow-hidden flex-shrink-0 relative">
          {track.cover_art_url ? (
            <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-3 h-3 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3 h-3 text-foreground" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist?.display_name || "Unknown Artist"}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
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
    isKaraokeMode,
    showLyrics,
    isPreviewMode,
    previewTimeRemaining,
    currentPreviewLimit,
    showPreviewEndedModal,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
    removeFromQueue,
    clearQueue,
    playTrack,
    reorderQueue,
    toggleKaraokeMode,
    toggleShowLyrics,
    setInstrumentalUrl,
    dismissPreviewEndedModal,
    restartPreview,
    grantFullAccess,
  } = useAudioPlayer();

  const { canUseFeature } = useFeatureGate();
  const { isOwned } = usePurchases();
  const { createPlaylist } = usePlaylists();
  const { showFeedback } = useFeedbackSafe();
  const [showQueue, setShowQueue] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showKaraokeHint, setShowKaraokeHint] = useState(false);
  
  // Load waveform preference from localStorage
  const WAVEFORM_PREF_KEY = "jumtunes_waveform_preference";
  const [showWaveform, setShowWaveform] = useState(() => {
    try {
      return localStorage.getItem(WAVEFORM_PREF_KEY) === "true";
    } catch {
      return false;
    }
  });
  
  // Persist waveform preference
  const toggleWaveform = () => {
    const newValue = !showWaveform;
    setShowWaveform(newValue);
    try {
      localStorage.setItem(WAVEFORM_PREF_KEY, String(newValue));
    } catch {
      // Ignore storage errors
    }
  };

  // One-time onboarding for karaoke feature
  const KARAOKE_ONBOARDING_KEY = "jumtunes_karaoke_onboarding_seen";
  const hasSeenKaraokeOnboarding = useRef(
    typeof localStorage !== "undefined" && localStorage.getItem(KARAOKE_ONBOARDING_KEY) === "true"
  );

  // Show hint when first karaoke track is played
  useEffect(() => {
    if (
      currentTrack?.has_karaoke &&
      !hasSeenKaraokeOnboarding.current
    ) {
      // Small delay so the player is visible first
      const timer = setTimeout(() => {
        setShowKaraokeHint(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id, currentTrack?.has_karaoke]);

  const dismissKaraokeHint = () => {
    setShowKaraokeHint(false);
    hasSeenKaraokeOnboarding.current = true;
    try {
      localStorage.setItem(KARAOKE_ONBOARDING_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  };

  // Fetch karaoke data for current track
  const { data: karaokeData } = useKaraokeData(
    currentTrack?.has_karaoke ? currentTrack.id : null
  );

  // Update instrumental URL when karaoke data loads
  useEffect(() => {
    if (karaokeData?.instrumental_url) {
      setInstrumentalUrl(getInstrumentalUrl(karaokeData.instrumental_url));
    } else {
      setInstrumentalUrl(null);
    }
  }, [karaokeData, setInstrumentalUrl]);

  // Enable keyboard shortcuts
  useAudioKeyboardShortcuts();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isPlayerVisible || !currentTrack) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handleShuffleClick = () => {
    if (!canUseFeature("shuffle")) {
      setPremiumFeatureName("Shuffle mode");
      setShowPremiumModal(true);
      return;
    }
    toggleShuffle();
  };

  const handleRepeatClick = () => {
    if (!canUseFeature("repeat")) {
      setPremiumFeatureName("Repeat mode");
      setShowPremiumModal(true);
      return;
    }
    cycleRepeatMode();
  };

  const handleQueueClick = () => {
    if (!canUseFeature("queuePanel")) {
      setPremiumFeatureName("Queue management");
      setShowPremiumModal(true);
      return;
    }
    setShowQueue(!showQueue);
  };

  const hasNext = queueIndex < queue.length - 1 || repeatMode === "all";
  const hasPrevious = queueIndex > 0 || currentTime > 3;

  // Get upcoming tracks for drag and drop
  const upcomingTracks = queue.slice(queueIndex + 1);
  const upcomingIds = upcomingTracks.map((track, index) => `${track.id}-${queueIndex + 1 + index}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = upcomingIds.indexOf(active.id as string);
    const newIndex = upcomingIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Convert to actual queue indices
      const actualOldIndex = queueIndex + 1 + oldIndex;
      const actualNewIndex = queueIndex + 1 + newIndex;
      reorderQueue(actualOldIndex, actualNewIndex);
    }
  };

  const canAccessQueue = canUseFeature("queuePanel");
  const canShuffle = canUseFeature("shuffle");
  const canRepeat = canUseFeature("repeat");

  const hasKaraoke = !!currentTrack?.has_karaoke;
  const karaokeReady = !!karaokeData?.instrumental_url;

  // Handle purchase success - grant full access
  const handlePurchaseSuccess = () => {
    if (currentTrack) {
      grantFullAccess(currentTrack.id);
    }
  };

  // Handle create playlist from modal
  const handleCreatePlaylist = async (data: { name: string; description?: string }) => {
    try {
      await createPlaylist.mutateAsync(data);
      showFeedback({
        type: "success",
        title: "Playlist created",
        message: `"${data.name}" created successfully`,
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to create playlist",
      });
    }
  };

  return (
    <>
      {/* Premium Feature Modal */}
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature={premiumFeatureName}
      />

      {/* Preview Ended Modal */}
      <PreviewEndedModal
        open={showPreviewEndedModal}
        onOpenChange={dismissPreviewEndedModal}
        track={currentTrack ? {
          id: currentTrack.id,
          title: currentTrack.title,
          cover_art_url: currentTrack.cover_art_url,
          price: currentTrack.price || 0,
          artist: currentTrack.artist,
        } : null}
        onReplayPreview={restartPreview}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      {/* Add to Playlist Modal */}
      {currentTrack && (
        <>
          <AddToPlaylistModal
            open={showAddToPlaylist}
            onOpenChange={setShowAddToPlaylist}
            trackId={currentTrack.id}
            trackTitle={currentTrack.title}
            onCreateNew={() => setShowCreatePlaylist(true)}
          />
          <CreatePlaylistModal
            open={showCreatePlaylist}
            onOpenChange={setShowCreatePlaylist}
            onSubmit={handleCreatePlaylist}
          />
        </>
      )}

      {/* Karaoke Lyrics Panel */}
      {showLyrics && currentTrack && (
        <KaraokeLyricsPanel
          lyrics={karaokeData?.lyrics || null}
          currentTime={currentTime}
          duration={duration}
          isKaraokeActive={isKaraokeMode}
          onClose={toggleShowLyrics}
          onSeek={seek}
          trackTitle={currentTrack.title}
          artistName={currentTrack.artist?.display_name || undefined}
        />
      )}

      {/* Queue Panel */}
      {showQueue && canAccessQueue && (
        <div 
          className="fixed right-4 z-50 w-80 max-h-[28rem] glass-card border border-glass-border/30 backdrop-blur-xl rounded-lg overflow-hidden animate-in slide-in-from-bottom duration-200"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="p-3 border-b border-glass-border/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Queue</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
                {queue.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearQueue}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            {queue.length === 0 ? (
              <div className="p-6 text-center">
                <ListMusic className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">Queue is empty</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Play a track to start building your queue</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Now Playing */}
                {currentTrack && queueIndex >= 0 && (
                  <div className="px-3 py-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Now Playing</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10">
                      <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0">
                        {currentTrack.cover_art_url ? (
                          <img src={currentTrack.cover_art_url} alt={currentTrack.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{currentTrack.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {currentTrack.artist?.display_name || "Unknown Artist"}
                        </p>
                      </div>
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
                    </div>
                  </div>
                )}

                {/* Up Next - Drag and Drop */}
                {upcomingTracks.length > 0 && (
                  <div className="px-3 py-1 mt-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Up Next</p>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={upcomingIds} strategy={verticalListSortingStrategy}>
                        {upcomingTracks.map((track, index) => {
                          const actualIndex = queueIndex + 1 + index;
                          return (
                            <SortableTrackItem
                              key={`${track.id}-${actualIndex}`}
                              track={track}
                              actualIndex={actualIndex}
                              onPlay={() => playTrack(track)}
                              onRemove={() => removeFromQueue(actualIndex)}
                            />
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                {/* Previously Played */}
                {queueIndex > 0 && (
                  <div className="px-3 py-1 mt-2 border-t border-glass-border/20 pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Previously Played</p>
                    {queue.slice(0, queueIndex).map((track, index) => (
                      <div
                        key={`${track.id}-prev-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer opacity-60"
                        onClick={() => playTrack(track)}
                      >
                        <div className="w-8 h-8 rounded bg-muted/50 overflow-hidden flex-shrink-0 relative">
                          {track.cover_art_url ? (
                            <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Disc3 className="w-3 h-3 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 text-foreground" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artist?.display_name || "Unknown Artist"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Player Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-glass-border/30 backdrop-blur-xl animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-64">
              <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0 relative">
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
                {/* Mini frequency visualizer overlay */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-0.5 bg-gradient-to-t from-black/60 to-transparent">
                    <MiniFrequencyVisualizer 
                      isPlaying={isPlaying && !isBuffering} 
                      barCount={5}
                      className="h-3"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentTrack.title}
                  </p>
                  {isPreviewMode && (
                    <Badge 
                      variant="outline" 
                      className="flex-shrink-0 text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-500 bg-amber-500/10"
                    >
                      <Clock className="w-2.5 h-2.5 mr-0.5" />
                      {Math.ceil(previewTimeRemaining)}s
                    </Badge>
                  )}
                  {hasKaraoke && (
                    <span 
                      className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded bg-primary/20 text-primary"
                      title="Karaoke available"
                    >
                      <Mic2 className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
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
                  className={`h-8 w-8 relative ${isShuffled && canShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={handleShuffleClick}
                  title={canShuffle ? (isShuffled ? "Shuffle on" : "Shuffle off") : "Premium feature"}
                >
                  <Shuffle className="h-4 w-4" />
                  {!canShuffle && <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />}
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
                  className={`h-8 w-8 relative ${repeatMode !== "off" && canRepeat ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={handleRepeatClick}
                  title={canRepeat ? (repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one") : "Premium feature"}
                >
                  {repeatMode === "one" && canRepeat ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                  {!canRepeat && <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />}
                </Button>
                
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                
                {showWaveform && currentTrack?.audio_url ? (
                  <div className="relative flex-1">
                    <UrlWaveformVisualizer
                      audioUrl={currentTrack.audio_url.startsWith('http') ? currentTrack.audio_url : `https://ezamzkycxqrstuznqaha.supabase.co/storage/v1/object/public/tracks/${currentTrack.audio_url}`}
                      currentTime={currentTime}
                      duration={isPreviewMode ? currentPreviewLimit : duration}
                      onSeek={seek}
                      className="flex-1 h-8"
                    />
                    {/* Preview limit marker */}
                    {isPreviewMode && duration > 0 && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 pointer-events-none"
                        style={{ left: `${(currentPreviewLimit / duration) * 100}%` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <Slider
                      value={[currentTime]}
                      max={isPreviewMode ? currentPreviewLimit : (duration || 100)}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="flex-1 cursor-pointer"
                    />
                    {/* Preview limit marker */}
                    {isPreviewMode && duration > currentPreviewLimit && (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-500 pointer-events-none rounded-full"
                        style={{ left: `${(currentPreviewLimit / duration) * 100}%` }}
                      />
                    )}
                  </div>
                )}
                
                <span className="text-xs text-muted-foreground w-10">
                  {isPreviewMode ? formatTime(currentPreviewLimit) : formatTime(duration)}
                </span>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        showWaveform ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={toggleWaveform}
                    >
                      <AudioWaveform className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{showWaveform ? "Simple progress" : "Waveform view"}</p>
                  </TooltipContent>
                </Tooltip>
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

            {/* Karaoke, Download, Queue, Volume & Close */}
            <div className="flex items-center gap-2">
              {/* Karaoke/Lyrics Button - only show if track has karaoke */}
              {hasKaraoke && (
                <>
                  {/* Lyrics Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          showLyrics ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={toggleShowLyrics}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{showLyrics ? "Hide lyrics" : "Show lyrics"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Karaoke Mode Toggle - visible on all screen sizes with label on mobile */}
                  <div className="relative">
                    <Tooltip open={showKaraokeHint} onOpenChange={(open) => !open && dismissKaraokeHint()}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 gap-1.5 px-2",
                            isKaraokeMode
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => {
                            dismissKaraokeHint();
                            toggleKaraokeMode();
                          }}
                          disabled={!karaokeReady}
                        >
                          {isKaraokeMode ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic2 className="h-4 w-4" />
                          )}
                          <span className="text-xs md:hidden">Karaoke</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className={cn(
                          showKaraokeHint && "bg-primary text-primary-foreground animate-pulse"
                        )}
                      >
                        <p>
                          {showKaraokeHint
                            ? "🎤 Tap to enable sing-along mode!"
                            : !karaokeReady
                              ? "Loading sing-along…"
                              : isKaraokeMode
                                ? "Switch to original audio"
                                : "Sing-along mode (instrumental)"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}

              {/* Add to Playlist Button - only for owned tracks */}
              {currentTrack && isOwned(currentTrack.id) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAddToPlaylist(true)}
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Add to playlist</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Download Button */}
              {currentTrack && (
                <DownloadButton
                  track={{
                    id: currentTrack.id,
                    title: currentTrack.title,
                    cover_art_url: currentTrack.cover_art_url,
                    price: currentTrack.price || 0,
                    audio_url: currentTrack.audio_url,
                    artist: currentTrack.artist ? { display_name: currentTrack.artist.display_name } : undefined,
                  }}
                  isOwned={isOwned(currentTrack.id)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                />
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 relative ${showQueue && canAccessQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={handleQueueClick}
              >
                <ListMusic className="h-4 w-4" />
                {canAccessQueue && queue.length > 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
                {!canAccessQueue && <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />}
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
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={isPreviewMode ? currentPreviewLimit : (duration || 100)}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              {/* Preview limit marker */}
              {isPreviewMode && duration > currentPreviewLimit && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-500 pointer-events-none rounded-full"
                  style={{ left: `${(currentPreviewLimit / duration) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
              <span className="text-xs text-muted-foreground">
                {isPreviewMode ? formatTime(currentPreviewLimit) : formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
