import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RECENTLY_PLAYED_KEY = "jumtunes_recently_played";
const MAX_RECENTLY_PLAYED = 20;
const DEFAULT_PREVIEW_LIMIT_SECONDS = 30;

// Helper to save recently played track (includes audio_url for Safari gesture chain)
const saveToRecentlyPlayed = (track: { 
  id: string; 
  title: string; 
  audio_url: string;
  cover_art_url: string | null;
  duration?: number | null;
  artist?: { id: string; display_name: string | null };
}) => {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    let existing = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    existing = existing.filter((t: { id: string }) => t.id !== track.id);
    
    // Add to front with timestamp (include audio_url for Safari compatibility)
    const newTrack = {
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration || null,
      artist_id: track.artist?.id || "",
      artist_name: track.artist?.display_name || null,
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
  needsUserGesture: boolean;
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
  resumePlayback: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const pendingPlayRef = useRef<{ track: AudioTrack; forcePreviewCheck: boolean } | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const bufferingRecoveryTimerRef = useRef<number | null>(null);
  const lastRecoverySrcRef = useRef<string | null>(null);
  const currentTrackRef = useRef<AudioTrack | null>(null);

  const isSafari = (() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    // Safari: has "Safari" but not Chrome/Chromium/Android
    return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Android/i.test(ua);
  })();
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
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
  const accessCache = useRef<Map<string, boolean>>(new Map());

  // Keep a ref to currentTrack for event handlers that shouldn't re-bind.
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

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

  // Safari/iOS audio unlock - must be called synchronously during user gesture
  // This primes the audio element to allow future play() calls
  const unlockAudio = useCallback((audio: HTMLAudioElement) => {
    if (audioUnlockedRef.current) return;
    
    // Safari requires an actual src to be set before play() works
    // Use a tiny silent audio data URI to unlock
    const silentDataUri = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    
    try {
      const prevSrc = audio.src;
      const prevMuted = audio.muted;
      
      audio.muted = true;
      audio.src = silentDataUri;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audio.pause();
          audioUnlockedRef.current = true;
          audio.muted = prevMuted;
          // Restore previous src if there was one
          if (prevSrc && prevSrc !== silentDataUri) {
            audio.src = prevSrc;
          }
          console.log("[Audio] Safari audio unlocked successfully");
        }).catch((e) => {
          audio.muted = prevMuted;
          // Restore previous src
          if (prevSrc && prevSrc !== silentDataUri) {
            audio.src = prevSrc;
          }
          console.log("[Audio] Safari unlock attempt completed:", e?.name || "unknown");
        });
      }
    } catch (e) {
      console.log("[Audio] Unlock error:", e);
    }
  }, []);

  const ensureAudioElement = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.volume = 1;
    // Safari compatibility: set preload to auto for better loading behavior
    audio.preload = "auto";
    // Safari/iOS compatibility: set playsinline attribute
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    // Note: Removing crossOrigin as it can cause CORS issues with Supabase storage on Safari

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime || 0);
    });

    const syncDuration = () => {
      const audioDuration = audio.duration;
      if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    };

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);

    audio.addEventListener("play", () => {
      setIsPlaying(true);
      setIsBuffering(false);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("waiting", () => {
      setIsBuffering(true);

      // Safari sometimes buffers indefinitely if the stored object content-type is wrong
      // (e.g., application/octet-stream). Add a recovery attempt after a short delay.
      if (isSafari) {
        if (bufferingRecoveryTimerRef.current) {
          window.clearTimeout(bufferingRecoveryTimerRef.current);
        }
        bufferingRecoveryTimerRef.current = window.setTimeout(() => {
          const a = audioRef.current;
          const track = currentTrackRef.current;
          if (!a || !track) return;

          // If we already recovered this exact src, don't loop.
          if (a.src && lastRecoverySrcRef.current === a.src) return;

          // Only attempt if still buffering and not progressing.
          if (!a.paused && (a.readyState === 0 || a.readyState === 1 || a.networkState === a.NETWORK_LOADING)) {
            void (async () => {
              try {
                // HEAD the audio src and check content-type
                const src = a.src;
                if (!src) return;

                const head = await fetch(src, { method: "HEAD" });
                const contentType = (head.headers.get("content-type") || "").toLowerCase();

                const looksWrong = !contentType.startsWith("audio/") || contentType.includes("octet-stream");
                if (!looksWrong) return;

                // Fetch as blob and re-create an object URL with a correct mime.
                const ext = src.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();
                const inferredType =
                  ext === "wav" ? "audio/wav" :
                  ext === "flac" ? "audio/flac" :
                  "audio/mpeg";

                const res = await fetch(src);
                const blob = await res.blob();
                const fixedBlob = new Blob([blob], { type: inferredType });

                if (activeObjectUrlRef.current) {
                  URL.revokeObjectURL(activeObjectUrlRef.current);
                }
                const objectUrl = URL.createObjectURL(fixedBlob);
                activeObjectUrlRef.current = objectUrl;
                lastRecoverySrcRef.current = src;

                const resumeAt = Number.isFinite(a.currentTime) ? a.currentTime : 0;

                a.src = objectUrl;
                // Do NOT call a.load() - Safari throws NotSupportedError

                try {
                  // Restore time after metadata is ready
                  a.currentTime = Math.max(0, resumeAt);
                } catch {
                  // iOS may block setting currentTime until metadata is loaded
                }

                const p = a.play();
                if (p) {
                  p.catch((playErr) => {
                    console.warn("[Audio] Safari recovery play failed:", playErr?.name);
                  });
                }
              } catch (e) {
                console.warn("[Audio] Safari recovery failed:", e);
              }
            })();
          }
        }, 2500);
      }
    });

    audio.addEventListener("canplay", () => {
      setIsBuffering(false);
    });

    // Safari: also listen to canplaythrough for better buffering handling
    audio.addEventListener("canplaythrough", () => {
      setIsBuffering(false);
    });

    audio.addEventListener("error", (e) => {
      const error = audio.error;
      console.error("[Audio] Playback error:", {
        code: error?.code,
        message: error?.message,
        event: e
      });
      setIsPlaying(false);
      setIsBuffering(false);
    });

    audioRef.current = audio;
    return audio;
  }, []);

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

  const getAudioUrl = useCallback((url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    const { data } = supabase.storage.from("tracks").getPublicUrl(url);
    return data.publicUrl;
  }, []);

  // Safari-compatible play: starts playback SYNCHRONOUSLY, then hydrates data async
  // CRITICAL: Do NOT call audio.load() - Safari throws NotSupportedError when load() + play() are chained
  const playTrackSafari = useCallback((track: AudioTrack, audio: HTMLAudioElement, audioUrl: string) => {
    const resolvedUrl = getAudioUrl(audioUrl);
    
    // Clear any previous buffering recovery state
    if (bufferingRecoveryTimerRef.current) {
      window.clearTimeout(bufferingRecoveryTimerRef.current);
      bufferingRecoveryTimerRef.current = null;
    }
    lastRecoverySrcRef.current = null;
    
    // Set source - Safari will auto-load when src is set
    // Do NOT call audio.load() as it breaks the gesture chain on Safari
    audio.src = resolvedUrl;
    
    // Reset to beginning
    try {
      audio.currentTime = 0;
    } catch {
      // iOS may block this until metadata loads - that's fine
    }
    
    // Play immediately to maintain gesture chain
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("[Audio] Playback started successfully");
          setIsBuffering(false);
        })
        .catch((error) => {
          console.warn("[Audio] Safari play rejected:", error.name, "-", error.message);
          
          if (error.name === "NotAllowedError") {
            // Autoplay blocked - store for retry on next interaction
            pendingPlayRef.current = { track, forcePreviewCheck: true };
            setNeedsUserGesture(true);
            setIsBuffering(false);
          } else if (error.name === "NotSupportedError") {
            // Safari NotSupportedError - try alternative approach
            console.log("[Audio] Trying Safari fallback approach...");
            
            // Reset and try with a slight delay (allows Safari to process the src)
            setTimeout(() => {
              if (audioRef.current && audioRef.current.src === resolvedUrl) {
                audioRef.current.play().catch((retryError) => {
                  console.warn("[Audio] Safari retry also failed:", retryError.name);
                  pendingPlayRef.current = { track, forcePreviewCheck: true };
                  setNeedsUserGesture(true);
                  setIsBuffering(false);
                });
              }
            }, 100);
          } else {
            // Other error - log and stop buffering
            console.error("[Audio] Playback error:", error);
            setIsBuffering(false);
          }
        });
    }
  }, [getAudioUrl]);

  // Async hydration that happens AFTER playback starts
  const hydrateTrackAsync = useCallback(async (track: AudioTrack, forcePreviewCheck: boolean) => {
    let audioUrl = track.audio_url;
    let hasKaraoke = track.has_karaoke;
    let previewDuration = track.preview_duration;

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

        if (!error && data) {
          if (needsHasKaraoke) {
            hasKaraoke = data?.has_karaoke ?? null;
          }
          if (needsPreviewDuration) {
            previewDuration = data?.preview_duration ?? DEFAULT_PREVIEW_LIMIT_SECONDS;
          }
          // Update track with hydrated data
          setCurrentTrack(prev => prev?.id === track.id ? {
            ...prev,
            has_karaoke: hasKaraoke,
            preview_duration: previewDuration || DEFAULT_PREVIEW_LIMIT_SECONDS,
          } : prev);
        }
      } catch (e) {
        console.error("Error hydrating track:", e);
      }
    }

    // Check access and set preview mode (async is fine here)
    if (forcePreviewCheck) {
      const hasAccess = await checkFullAccess(track.id);
      setIsPreviewMode(!hasAccess);
    }
  }, [checkFullAccess]);

  const playTrackInternal = useCallback((track: AudioTrack, forcePreviewCheck = true) => {
    const audio = ensureAudioElement();

    // Clean up any previous blob URL (Safari recovery path)
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }

    // Reset state synchronously
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlayerVisible(true);
    setIsBuffering(true);
    setShowPreviewEndedModal(false);
    setCurrentTrack(track);

    // Save to recently played
    saveToRecentlyPlayed(track);

    let audioUrl = track.audio_url;
    
    // Validate audio URL - check for corrupted/invalid extensions (e.g., .mo3 instead of .mp3)
    // This can happen when stale localStorage data has corrupted URLs
    const isValidAudioUrl = (url: string): boolean => {
      if (!url || url.trim() === "") return false;
      const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
      return cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".flac") || cleanUrl.endsWith(".m4a") || cleanUrl.endsWith(".aac");
    };
    
    const needsAudioUrl = !audioUrl || !isValidAudioUrl(audioUrl);

    if (needsAudioUrl) {
      // Need to fetch audio URL first - breaks gesture chain but necessary
      // This path is for tracks without pre-hydrated audio_url or corrupted URLs
      supabase
        .from("tracks")
        .select("audio_url, has_karaoke, preview_duration")
        .eq("id", track.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data?.audio_url) {
            console.error("[Audio] Failed to get audio URL:", error);
            setIsBuffering(false);
            return;
          }

          const hydratedTrack: AudioTrack = {
            ...track,
            audio_url: data.audio_url,
            has_karaoke: data.has_karaoke ?? null,
            preview_duration: data.preview_duration ?? DEFAULT_PREVIEW_LIMIT_SECONDS,
          };

          setCurrentTrack(hydratedTrack);
          
          // Play with the fetched URL - do NOT call load() as it breaks Safari
          const resolvedUrl = getAudioUrl(data.audio_url);
          audio.src = resolvedUrl;
          // Safari auto-loads when src changes, calling load() throws NotSupportedError
          audio.play().catch((e) => {
            console.warn("[Audio] Play after hydration failed:", e.name, "-", e.message);
            if (e?.name === "NotAllowedError" || e?.name === "NotSupportedError") {
              pendingPlayRef.current = { track: hydratedTrack, forcePreviewCheck };
              setNeedsUserGesture(true);
              setIsBuffering(false);
            }
          });

          // Check access async
          if (forcePreviewCheck) {
            checkFullAccess(track.id).then(hasAccess => {
              setIsPreviewMode(!hasAccess);
            });
          }
        });
    } else {
      // We have audio URL - play SYNCHRONOUSLY to maintain Safari gesture chain
      playTrackSafari(track, audio, audioUrl);
      
      // Hydrate additional data async (karaoke, preview duration, access check)
      hydrateTrackAsync(track, forcePreviewCheck);
    }
  }, [getAudioUrl, ensureAudioElement, checkFullAccess, playTrackSafari, hydrateTrackAsync]);

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

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }

      if (bufferingRecoveryTimerRef.current) {
        window.clearTimeout(bufferingRecoveryTimerRef.current);
        bufferingRecoveryTimerRef.current = null;
      }
    };
  }, [ensureAudioElement]);

  const resumePlayback = useCallback(() => {
    const audio = ensureAudioElement();

    // If we have a stored pending track, replay that (best chance to preserve user intent)
    if (pendingPlayRef.current) {
      const { track, forcePreviewCheck } = pendingPlayRef.current;
      pendingPlayRef.current = null;
      setNeedsUserGesture(false);
      playTrackInternal(track, forcePreviewCheck);
      return;
    }

    // Otherwise just try to play the current source
    setNeedsUserGesture(false);
    audio.play().catch((e: any) => {
      if (e?.name === "NotAllowedError") {
        setNeedsUserGesture(true);
        setIsBuffering(false);
      }
    });
  }, [ensureAudioElement, playTrackInternal]);

  // Safari audio unlock: Listen for first user interaction to unlock audio
  useEffect(() => {
    const handleUserInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;

      // Try to unlock audio on first interaction
      if (!audioUnlockedRef.current) {
        unlockAudio(audio);
      }

      // If there's a pending play that failed due to NotAllowedError, retry it
      if (pendingPlayRef.current) {
        const { track, forcePreviewCheck } = pendingPlayRef.current;
        pendingPlayRef.current = null;
        setNeedsUserGesture(false);
        playTrackInternal(track, forcePreviewCheck);
      }
    };

    // Add listeners for various user interactions
    document.addEventListener("click", handleUserInteraction, { once: false, passive: true });
    document.addEventListener("touchstart", handleUserInteraction, { once: false, passive: true });
    document.addEventListener("keydown", handleUserInteraction, { once: false, passive: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [unlockAudio, playTrackInternal]);

  // Clear access cache on user change
  useEffect(() => {
    accessCache.current.clear();
  }, [user?.id]);

  const playTrack = useCallback((track: AudioTrack) => {
    const audio = ensureAudioElement();

    // Attempt to unlock audio on every playTrack call (will no-op if already unlocked)
    unlockAudio(audio);

    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch((e: any) => {
          console.warn("[Audio] Toggle play failed:", e);
          if (e?.name === "NotAllowedError") {
            setNeedsUserGesture(true);
            setIsBuffering(false);
          }
        });
      }
      return;
    }

    // Check if track is already in queue
    const existingIndex = queue.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      setQueueIndex(existingIndex);
    } else {
      // Add to queue and set as current
      setQueue(prev => [...prev, track]);
      setQueueIndex(queue.length);
    }

    playTrackInternal(track);
  }, [currentTrack?.id, isPlaying, queue, ensureAudioElement, playTrackInternal, unlockAudio]);

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
      audio.play().catch((e: any) => {
        console.error(e);
        if (e?.name === "NotAllowedError") {
          setNeedsUserGesture(true);
          setIsBuffering(false);
        }
      });
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
      audio.play().catch((e: any) => {
        console.error(e);
        if (e?.name === "NotAllowedError") {
          setNeedsUserGesture(true);
          setIsBuffering(false);
        }
      });
    }
    setShowPreviewEndedModal(false);
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
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isBuffering,
        needsUserGesture,
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
        resumePlayback,
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
  needsUserGesture: false,
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
  resumePlayback: () => {},
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
