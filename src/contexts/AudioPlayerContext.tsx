import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

    const audioUrl = getAudioUrl(track.audio_url);
    audio.src = audioUrl;
    audio.load();
    audio.play().catch(console.error);
  }, [getAudioUrl, ensureAudioElement]);

  // Handle track ended - auto-play next in queue
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Auto-play next track if available
      if (queueIndex < queue.length - 1) {
        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        playTrackInternal(queue[nextIndex]);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [queue, queueIndex, playTrackInternal]);

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
    }
  }, [queue, queueIndex, playTrackInternal]);

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
