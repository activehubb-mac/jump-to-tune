import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RECENTLY_PLAYED_KEY = "jumtunes_recently_played";
const MAX_RECENTLY_PLAYED = 20;
const DEFAULT_PREVIEW_LIMIT_SECONDS = 30;

// Helper to save recently played track - includes audio_url for iOS playback
const saveToRecentlyPlayed = (track: { 
  id: string; 
  title: string; 
  cover_art_url: string | null;
  audio_url?: string;
  duration?: number | null;
  artist?: { id: string; display_name: string | null };
}) => {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    let existing = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    existing = existing.filter((t: { id: string }) => t.id !== track.id);
    
    // Add to front with timestamp - include audio_url for iOS gesture chain
    const newTrack = {
      id: track.id,
      title: track.title,
      cover_art_url: track.cover_art_url,
      artist_id: track.artist?.id || "",
      artist_name: track.artist?.display_name || null,
      audio_url: track.audio_url || null,
      duration: track.duration || null,
      playedAt: Date.now(),
    };
    
    existing = [newTrack, ...existing].slice(0, MAX_RECENTLY_PLAYED);
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save recently played:", e);
  }
};

export interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  duration?: number | null;
  price?: number;
  has_karaoke?: boolean | null;
  preview_duration?: number;
  artist?: {
    id: string;
    display_name: string | null;
  };
}

type RepeatMode = "off" | "all" | "one";

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  audioError: string | null;
  isPlaybackBlocked: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlayerVisible: boolean;
  queue: AudioTrack[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isKaraokeMode: boolean;
  showLyrics: boolean;
  isPreviewMode: boolean;
  previewTimeRemaining: number;
  currentPreviewLimit: number;
  showPreviewEndedModal: boolean;
  playTrack: (track: AudioTrack) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
  addToQueue: (track: AudioTrack) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  toggleKaraokeMode: () => void;
  toggleShowLyrics: () => void;
  setInstrumentalUrl: (url: string | null) => void;
  dismissPreviewEndedModal: () => void;
  restartPreview: () => void;
  grantFullAccess: (trackId: string) => void;
  retryPlayback: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [originalQueue, setOriginalQueue] = useState<AudioTrack[]>([]);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [instrumentalUrl, setInstrumentalUrlState] = useState<string | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  
  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showPreviewEndedModal, setShowPreviewEndedModal] = useState(false);
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const accessCache = useRef<Map<string, boolean>>(new Map());

  // Check if user has full access to a track
  const checkFullAccess = useCallback(async (trackId: string): Promise<boolean> => {
    if (!user) return false;

    // Check cache first
    if (accessCache.current.has(trackId)) {
      return accessCache.current.get(trackId)!;
    }

    try {
      // Check if user purchased the track
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", trackId)
        .maybeSingle();

      if (purchase) {
        accessCache.current.set(trackId, true);
        return true;
      }

      // Check if user is the artist or label owner
      const { data: track } = await supabase
        .from("tracks")
        .select("artist_id, label_id")
        .eq("id", trackId)
        .single();

      const hasAccess = track?.artist_id === user.id || track?.label_id === user.id;
      accessCache.current.set(trackId, hasAccess);
      return hasAccess;
    } catch (e) {
      console.error("Error checking track access:", e);
      accessCache.current.set(trackId, false);
      return false;
    }
  }, [user]);

  // Grant full access (called after purchase)
  const grantFullAccess = useCallback((trackId: string) => {
    accessCache.current.set(trackId, true);
    if (currentTrack?.id === trackId) {
      setIsPreviewMode(false);
    }
  }, [currentTrack?.id]);

  // Get current preview limit from track or use default
  const currentPreviewLimit = currentTrack?.preview_duration || DEFAULT_PREVIEW_LIMIT_SECONDS;

  const previewTimeRemaining = isPreviewMode 
    ? Math.max(0, currentPreviewLimit - currentTime)
    : 0;

  // Track if audio context is unlocked (for iOS)
  const isAudioUnlockedRef = useRef(false);

  const ensureAudioElement = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.volume = 1;
    
    // iOS/Safari requires these attributes for proper playback
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    // NOTE: Don't set crossOrigin='anonymous' - it causes CORS errors on Safari
    // when the server doesn't explicitly send Access-Control-Allow-Origin headers
    // Supabase storage is public and doesn't require CORS headers for same-origin
    // Preload metadata - use 'metadata' instead of 'auto' for faster initial load on mobile
    audio.preload = 'metadata';

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime || 0);
    });

    const syncDuration = () => {
      const audioDuration = audio.duration;
      if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    };

    audio.addEventListener("loadedmetadata", () => {
      console.log("Audio metadata loaded, duration:", audio.duration);
      syncDuration();
    });
    audio.addEventListener("durationchange", syncDuration);

    audio.addEventListener("play", () => {
      console.log("Audio play event fired");
      setIsPlaying(true);
      setIsBuffering(false);
      setIsPlaybackBlocked(false);
      isAudioUnlockedRef.current = true;
    });

    audio.addEventListener("pause", () => {
      console.log("Audio pause event fired");
      setIsPlaying(false);
    });

    audio.addEventListener("waiting", () => {
      console.log("Audio waiting/buffering");
      setIsBuffering(true);
    });

    audio.addEventListener("playing", () => {
      console.log("Audio playing event fired");
      setIsBuffering(false);
    });

    audio.addEventListener("canplay", () => {
      console.log("Audio can play");
      setIsBuffering(false);
    });

    audio.addEventListener("error", (e) => {
      const errorCode = audio.error?.code;
      const errorMessage = audio.error?.message;
      console.error("[AudioPlayer] Audio element error:", {
        code: errorCode,
        message: errorMessage,
        src: audio.src,
        event: e,
      });
      // Error codes: 1=MEDIA_ERR_ABORTED, 2=MEDIA_ERR_NETWORK, 3=MEDIA_ERR_DECODE, 4=MEDIA_ERR_SRC_NOT_SUPPORTED
      const errorMessages: Record<number, string> = {
        1: "Playback aborted",
        2: "Network error - check connection",
        3: "Audio decode failed",
        4: "Audio format not supported",
      };
      setAudioError(errorMessages[errorCode || 0] || "Failed to load audio");
      setIsPlaying(false);
      setIsBuffering(false);
    });
    
    audio.addEventListener("stalled", () => {
      console.warn("Audio stalled - network issue or slow connection");
    });
    
    audio.addEventListener("abort", () => {
      console.log("Audio load aborted");
    });

    audioRef.current = audio;
    return audio;
  }, []);

  // Unlock audio on iOS - must be called from user interaction
  const unlockAudioForIOS = useCallback(() => {
    if (isAudioUnlockedRef.current) return Promise.resolve();
    
    const audio = ensureAudioElement();
    
    // Play a silent sound to unlock audio context on iOS
    // This must happen synchronously within the user gesture
    audio.muted = true;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          audio.pause();
          audio.muted = false;
          audio.currentTime = 0;
          isAudioUnlockedRef.current = true;
        })
        .catch(() => {
          audio.muted = false;
          // Silently fail - will retry on next interaction
        });
    }
    
    audio.muted = false;
    return Promise.resolve();
  }, [ensureAudioElement]);

  // Enforce preview limit
  useEffect(() => {
    if (!isPreviewMode || !audioRef.current) return;

    const audio = audioRef.current;
    const previewLimit = currentTrack?.preview_duration || DEFAULT_PREVIEW_LIMIT_SECONDS;
    
    const checkPreviewLimit = () => {
      if (audio.currentTime >= previewLimit) {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);
        setShowPreviewEndedModal(true);
      }
    };

    audio.addEventListener("timeupdate", checkPreviewLimit);
    return () => audio.removeEventListener("timeupdate", checkPreviewLimit);
  }, [isPreviewMode, currentTrack?.preview_duration]);

  const getAudioUrl = useCallback((url: string): string => {
    if (!url || url.trim() === "") {
      console.error("[AudioPlayer] Empty audio URL provided");
      return "";
    }
    
    const trimmedUrl = url.trim();
    
    // Already a full URL
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }
    
    // Relative path - convert to full Supabase storage URL
    const { data } = supabase.storage.from("tracks").getPublicUrl(trimmedUrl);
    const publicUrl = data.publicUrl;
    
    console.log("[AudioPlayer] Resolved relative URL:", { 
      original: url, 
      resolved: publicUrl 
    });
    
    return publicUrl;
  }, []);

  const playTrackInternal = useCallback(async (track: AudioTrack, forcePreviewCheck = true) => {
    const audio = ensureAudioElement();

    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlayerVisible(true);
    setIsBuffering(true);
    setShowPreviewEndedModal(false);

    let audioUrl = track.audio_url;
    let hasKaraoke = track.has_karaoke;
    let previewDuration = track.preview_duration;

    // Hydrate missing fields (some callers only pass a subset of track fields)
    const needsAudioUrl = !audioUrl || audioUrl.trim() === "";
    const needsHasKaraoke = hasKaraoke === undefined || hasKaraoke === null;
    const needsPreviewDuration = previewDuration === undefined;

    if (needsAudioUrl || needsHasKaraoke || needsPreviewDuration) {
      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("audio_url, has_karaoke, preview_duration")
          .eq("id", track.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to hydrate track:", error);
          setIsBuffering(false);
          return;
        }

        if (needsAudioUrl) {
          if (!data?.audio_url) {
            console.error("No audio URL found for track:", track.id);
            setIsBuffering(false);
            return;
          }
          audioUrl = data.audio_url;
        }

        if (needsHasKaraoke) {
          hasKaraoke = data?.has_karaoke ?? null;
        }

        if (needsPreviewDuration) {
          previewDuration = data?.preview_duration ?? DEFAULT_PREVIEW_LIMIT_SECONDS;
        }
      } catch (e) {
        console.error("Error hydrating track:", e);
        setIsBuffering(false);
        return;
      }
    }

    const hydratedTrack: AudioTrack = {
      ...track,
      audio_url: audioUrl,
      has_karaoke: hasKaraoke,
      preview_duration: previewDuration || DEFAULT_PREVIEW_LIMIT_SECONDS,
    };

    setCurrentTrack(hydratedTrack);

    // Check access and set preview mode
    if (forcePreviewCheck) {
      const hasAccess = await checkFullAccess(track.id);
      setIsPreviewMode(!hasAccess);
    }

    // Save to recently played
    saveToRecentlyPlayed(hydratedTrack);

    const resolvedUrl = getAudioUrl(audioUrl);
    audio.src = resolvedUrl;
    audio.load();
    
    // Reset blocked state
    setIsPlaybackBlocked(false);
    
    // Use loadedmetadata event - more reliable on iOS 17.4+
    // canplaythrough often fails to fire on iOS, causing infinite buffering
    const startPlayback = () => {
      audio.play()
        .then(() => {
          setIsPlaybackBlocked(false);
        })
        .catch((err) => {
          console.error("Playback failed:", err);
          if (err.name === 'NotAllowedError') {
            setIsPlaybackBlocked(true);
          }
          setIsBuffering(false);
        });
      audio.removeEventListener('loadedmetadata', startPlayback);
    };
    
    // If already unlocked and can play, start immediately
    if (isAudioUnlockedRef.current) {
      audio.addEventListener('loadedmetadata', startPlayback, { once: true });
      // Also try immediate play in case audio is already ready
      audio.play()
        .then(() => {
          setIsPlaybackBlocked(false);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            setIsPlaybackBlocked(true);
            setIsBuffering(false);
          }
        });
    } else {
      // First time - wait for loadedmetadata
      audio.addEventListener('loadedmetadata', startPlayback, { once: true });
    }
  }, [getAudioUrl, ensureAudioElement, checkFullAccess]);

  // Handle track ended - auto-play next based on repeat/shuffle modes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (repeatMode === "one") {
        // Repeat current track
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else if (queueIndex < queue.length - 1) {
        // Play next track
        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        playTrackInternal(queue[nextIndex]);
      } else if (repeatMode === "all" && queue.length > 0) {
        // Loop back to start
        setQueueIndex(0);
        playTrackInternal(queue[0]);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [queue, queueIndex, repeatMode, playTrackInternal]);

  useEffect(() => {
    ensureAudioElement();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [ensureAudioElement]);

  // Clear access cache on user change
  useEffect(() => {
    accessCache.current.clear();
  }, [user?.id]);

  const playTrack = useCallback((track: AudioTrack) => {
    const audio = ensureAudioElement();

    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.error);
      }
      return;
    }

    // CRITICAL FOR iOS/Safari: Everything must be synchronous within user gesture
    // No awaits, no promises that block - gesture chain must be preserved
    
    // Validate audio_url - if missing, we need to hydrate from database
    const audioUrl = track.audio_url?.trim() || "";
    
    if (!audioUrl) {
      console.warn("No audio_url provided for track:", track.id, "- hydrating from database");
      // Set UI state immediately for user feedback
      setIsBuffering(true);
      setIsPlayerVisible(true);
      setCurrentTime(0);
      setCurrentTrack({
        ...track,
        audio_url: "",
      });
      
      // Fall back to async hydration (will lose gesture chain on iOS, but better than nothing)
      playTrackInternal(track, true);
      return;
    }
    
    const resolvedUrl = getAudioUrl(audioUrl);
    
    // Validate the resolved URL
    if (!resolvedUrl || (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://'))) {
      console.error("[AudioPlayer] Invalid audio URL after resolution:", {
        trackId: track.id,
        trackTitle: track.title,
        originalUrl: audioUrl,
        resolvedUrl: resolvedUrl,
      });
      setAudioError("Invalid audio URL");
      setIsBuffering(false);
      return;
    }
    
    // Clear any previous error
    setAudioError(null);
    
    console.log("[AudioPlayer] Playing track:", {
      id: track.id,
      title: track.title,
      audioUrl: resolvedUrl.substring(0, 80) + "...",
    });
    
    // Set UI state immediately (before any async)
    setIsPlaying(true);
    setIsBuffering(true);
    setIsPlayerVisible(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlaybackBlocked(false);
    
    // Create basic hydrated track for immediate display
    const basicTrack: AudioTrack = {
      id: track.id,
      title: track.title || "",
      audio_url: resolvedUrl,
      cover_art_url: track.cover_art_url,
      duration: track.duration || 0,
      has_karaoke: track.has_karaoke || null,
      preview_duration: track.preview_duration || DEFAULT_PREVIEW_LIMIT_SECONDS,
      artist: track.artist,
    };
    setCurrentTrack(basicTrack);
    
    // Set audio source and play - MUST be synchronous with gesture
    audio.src = resolvedUrl;
    
    // Add one-time error handler for this specific load
    const handleLoadError = () => {
      console.error("[AudioPlayer] Failed to load audio:", {
        trackId: track.id,
        trackTitle: track.title,
        src: audio.src,
        error: audio.error ? {
          code: audio.error.code,
          message: audio.error.message,
        } : 'Unknown error',
      });
      setIsPlaying(false);
      setIsBuffering(false);
      audio.removeEventListener('error', handleLoadError);
    };
    audio.addEventListener('error', handleLoadError, { once: true });
    
    // Single play call - Safari gets confused with multiple attempts
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioUnlockedRef.current = true;
          audio.removeEventListener('error', handleLoadError);
          console.log("[AudioPlayer] Playback started successfully:", track.title);
        })
        .catch((err) => {
          console.error("[AudioPlayer] Play promise rejected:", {
            trackTitle: track.title,
            errorName: err.name,
            errorMessage: err.message,
          });
          if (err.name === 'NotAllowedError') {
            // Safari blocked - show tap to play overlay
            setIsPlaybackBlocked(true);
            setIsPlaying(false);
          } else if (err.name === 'NotSupportedError' || err.name === 'AbortError') {
            // Audio format not supported or load was aborted
            console.error("[AudioPlayer] Audio source issue:", resolvedUrl);
            setIsPlaying(false);
          }
          setIsBuffering(false);
        });
    }
    
    // Queue management (sync, no await)
    const existingIndex = queue.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      setQueueIndex(existingIndex);
    } else {
      setQueue(prev => [...prev, track]);
      setQueueIndex(queue.length);
    }
    
    // Background async work - doesn't block playback
    checkFullAccess(track.id).then(hasAccess => {
      setIsPreviewMode(!hasAccess);
    });
    
    // Save to recently played
    saveToRecentlyPlayed(basicTrack);
  }, [currentTrack?.id, isPlaying, queue, ensureAudioElement, getAudioUrl, checkFullAccess, playTrackInternal]);

  const addToQueue = useCallback((track: AudioTrack) => {
    // Don't add duplicates
    if (queue.some(t => t.id === track.id)) return;
    
    setQueue(prev => [...prev, track]);
    
    // If nothing is playing, start playing
    if (!currentTrack) {
      setQueueIndex(queue.length);
      playTrackInternal(track);
    }
  }, [queue, currentTrack, playTrackInternal]);

  const playNext = useCallback(() => {
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      playTrackInternal(queue[nextIndex]);
    } else if (repeatMode === "all" && queue.length > 0) {
      // Loop back to start
      setQueueIndex(0);
      playTrackInternal(queue[0]);
    }
  }, [queue, queueIndex, repeatMode, playTrackInternal]);

  const playPrevious = useCallback(() => {
    const audio = ensureAudioElement();
    
    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    
    // Otherwise go to previous track
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playTrackInternal(queue[prevIndex]);
    }
  }, [queue, queueIndex, ensureAudioElement, playTrackInternal]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    
    // Adjust queueIndex if needed
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    } else if (index === queueIndex) {
      // Current track removed, play next or stop
      if (queue.length > 1 && index < queue.length - 1) {
        playTrackInternal(queue[index + 1]);
      } else if (index > 0) {
        setQueueIndex(index - 1);
        playTrackInternal(queue[index - 1]);
      } else {
        closePlayer();
      }
    }
  }, [queue, queueIndex, playTrackInternal]);

  const togglePlayPause = useCallback(() => {
    const audio = ensureAudioElement();

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying, ensureAudioElement]);

  const seek = useCallback((time: number) => {
    const audio = ensureAudioElement();
    const previewLimit = currentTrack?.preview_duration || DEFAULT_PREVIEW_LIMIT_SECONDS;
    
    // In preview mode, prevent seeking past the limit
    if (isPreviewMode && time >= previewLimit) {
      time = previewLimit - 0.5;
    }
    
    audio.currentTime = time;
    setCurrentTime(time);
  }, [ensureAudioElement, isPreviewMode, currentTrack?.preview_duration]);

  const setVolume = useCallback((level: number) => {
    const audio = ensureAudioElement();
    audio.volume = level;
    setVolumeState(level);
    setIsMuted(level === 0);
  }, [ensureAudioElement]);

  const toggleMute = useCallback(() => {
    const audio = ensureAudioElement();

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume, ensureAudioElement]);

  const toggleShuffle = useCallback(() => {
    if (isShuffled) {
      // Restore original order
      if (originalQueue.length > 0) {
        const currentTrackId = currentTrack?.id;
        setQueue(originalQueue);
        if (currentTrackId) {
          const newIndex = originalQueue.findIndex(t => t.id === currentTrackId);
          setQueueIndex(newIndex !== -1 ? newIndex : 0);
        }
      }
      setIsShuffled(false);
    } else {
      // Shuffle queue but keep current track in place
      setOriginalQueue([...queue]);
      const currentTrackItem = queue[queueIndex];
      const otherTracks = queue.filter((_, i) => i !== queueIndex);
      
      // Fisher-Yates shuffle
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      
      const shuffled = [currentTrackItem, ...otherTracks];
      setQueue(shuffled);
      setQueueIndex(0);
      setIsShuffled(true);
    }
  }, [isShuffled, queue, queueIndex, currentTrack, originalQueue]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  const toggleKaraokeMode = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const currentPos = audio.currentTime;
    const wasPlaying = !audio.paused;
    const newMode = !isKaraokeMode;

    setIsBuffering(true);

    try {
      if (newMode && instrumentalUrl) {
        // Switch to instrumental - save original URL first
        if (!originalAudioUrl) {
          setOriginalAudioUrl(audio.src);
        }
        audio.src = instrumentalUrl;
      } else if (!newMode && originalAudioUrl) {
        // Switch back to original
        audio.src = originalAudioUrl;
      } else if (!newMode && currentTrack.audio_url) {
        // Fallback: use track's audio_url
        audio.src = getAudioUrl(currentTrack.audio_url);
      }

      // Wait for audio to be ready before seeking
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error('Failed to load audio'));
        };
        
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
        audio.load();
        
        // Timeout after 10 seconds
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error('Audio load timeout'));
        }, 10000);
      });

      // Restore position (respect preview limit)
      const previewLimit = currentTrack?.preview_duration || DEFAULT_PREVIEW_LIMIT_SECONDS;
      const targetTime = isPreviewMode ? Math.min(currentPos, previewLimit - 0.5) : currentPos;
      audio.currentTime = targetTime;
      
      if (wasPlaying) {
        await audio.play();
      }

      setIsKaraokeMode(newMode);
    } catch (error) {
      console.error('Failed to switch audio mode:', error);
      // Revert on error - try to restore original audio
      if (originalAudioUrl) {
        audio.src = originalAudioUrl;
        audio.load();
        audio.currentTime = currentPos;
        if (wasPlaying) {
          audio.play().catch(console.error);
        }
      }
    } finally {
      setIsBuffering(false);
    }
  }, [currentTrack, instrumentalUrl, originalAudioUrl, isKaraokeMode, isPreviewMode, getAudioUrl]);

  const toggleShowLyrics = useCallback(() => {
    setShowLyrics(prev => !prev);
  }, []);

  const setInstrumentalUrl = useCallback((url: string | null) => {
    setInstrumentalUrlState(url);
  }, []);

  const dismissPreviewEndedModal = useCallback(() => {
    setShowPreviewEndedModal(false);
  }, []);

  const restartPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
      audio.play().catch(console.error);
    }
    setShowPreviewEndedModal(false);
  }, []);

  // Retry playback when blocked (iOS tap to play)
  const retryPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setIsPlaybackBlocked(false);
      setIsBuffering(true);
      audio.play()
        .then(() => {
          setIsPlaybackBlocked(false);
          isAudioUnlockedRef.current = true;
        })
        .catch((err) => {
          console.error("Retry playback failed:", err);
          if (err.name === 'NotAllowedError') {
            setIsPlaybackBlocked(true);
          }
        })
        .finally(() => {
          setIsBuffering(false);
        });
    }
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlayerVisible(false);
    setQueue([]);
    setQueueIndex(-1);
    setIsShuffled(false);
    setRepeatMode("off");
    setOriginalQueue([]);
    setIsKaraokeMode(false);
    setShowLyrics(false);
    setInstrumentalUrlState(null);
    setOriginalAudioUrl(null);
    setIsPreviewMode(false);
    setShowPreviewEndedModal(false);
    setIsPlaybackBlocked(false);
    setAudioError(null);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isBuffering,
        audioError,
        isPlaybackBlocked,
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
        playTrack,
        togglePlayPause,
        seek,
        setVolume,
        toggleMute,
        closePlayer,
        addToQueue,
        playNext,
        playPrevious,
        clearQueue,
        removeFromQueue,
        toggleShuffle,
        cycleRepeatMode,
        reorderQueue,
        toggleKaraokeMode,
        toggleShowLyrics,
        setInstrumentalUrl,
        dismissPreviewEndedModal,
        restartPreview,
        grantFullAccess,
        retryPlayback,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

// Default values for when context isn't available (prevents crashes during hot reload)
const defaultAudioPlayerContext: AudioPlayerContextType = {
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  audioError: null,
  isPlaybackBlocked: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isPlayerVisible: false,
  queue: [],
  queueIndex: -1,
  isShuffled: false,
  repeatMode: "off",
  isKaraokeMode: false,
  showLyrics: false,
  isPreviewMode: false,
  previewTimeRemaining: 0,
  currentPreviewLimit: 30,
  showPreviewEndedModal: false,
  playTrack: () => {},
  togglePlayPause: () => {},
  seek: () => {},
  setVolume: () => {},
  toggleMute: () => {},
  closePlayer: () => {},
  addToQueue: () => {},
  playNext: () => {},
  playPrevious: () => {},
  clearQueue: () => {},
  removeFromQueue: () => {},
  toggleShuffle: () => {},
  cycleRepeatMode: () => {},
  reorderQueue: () => {},
  toggleKaraokeMode: () => {},
  toggleShowLyrics: () => {},
  setInstrumentalUrl: () => {},
  dismissPreviewEndedModal: () => {},
  restartPreview: () => {},
  grantFullAccess: () => {},
  retryPlayback: () => {},
};

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  // Return default context if not available (prevents crashes during hot reload or edge cases)
  if (!context) {
    console.warn("useAudioPlayer: Context not available, using default values. This may indicate the provider is not properly mounted.");
    return defaultAudioPlayerContext;
  }
  return context;
}
