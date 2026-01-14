import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const RECENTLY_PLAYED_KEY = "jumtunes_recently_played";
const MAX_RECENTLY_PLAYED = 20;

// Helper to save recently played track
const saveToRecentlyPlayed = (track: { 
  id: string; 
  title: string; 
  cover_art_url: string | null;
  artist?: { id: string; display_name: string | null };
}) => {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    let existing = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    existing = existing.filter((t: { id: string }) => t.id !== track.id);
    
    // Add to front with timestamp
    const newTrack = {
      id: track.id,
      title: track.title,
      cover_art_url: track.cover_art_url,
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
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlayerVisible: boolean;
  queue: AudioTrack[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
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
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
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

  const ensureAudioElement = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.volume = 1;

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
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("waiting", () => {
      setIsBuffering(true);
    });

    audio.addEventListener("canplay", () => {
      setIsBuffering(false);
    });

    audio.addEventListener("error", () => {
      console.error("Audio playback error", audio.error);
      setIsPlaying(false);
    });

    audioRef.current = audio;
    return audio;
  }, []);

  const getAudioUrl = useCallback((url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    const { data } = supabase.storage.from("tracks").getPublicUrl(url);
    return data.publicUrl;
  }, []);

  const playTrackInternal = useCallback((track: AudioTrack) => {
    const audio = ensureAudioElement();
    
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlayerVisible(true);

    // Save to recently played
    saveToRecentlyPlayed(track);

    const audioUrl = getAudioUrl(track.audio_url);
    audio.src = audioUrl;
    audio.load();
    audio.play().catch(console.error);
  }, [getAudioUrl, ensureAudioElement]);

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
  }, [currentTrack?.id, isPlaying, queue, ensureAudioElement, playTrackInternal]);

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
    audio.currentTime = time;
    setCurrentTime(time);
  }, [ensureAudioElement]);

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
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
