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
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlayerVisible: boolean;
  playTrack: (track: AudioTrack) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

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

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener("play", () => {
      setIsPlaying(true);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("error", () => {
      // Helps diagnose CORS/permissions issues for Supabase storage URLs
      // eslint-disable-next-line no-console
      console.error("Audio playback error", audio.error);
      setIsPlaying(false);
    });

    audioRef.current = audio;
    return audio;
  }, []);

  // Initialize audio element on mount so first click never races the useEffect
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

  const getAudioUrl = useCallback((url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    const { data } = supabase.storage.from("tracks").getPublicUrl(url);
    return data.publicUrl;
  }, []);

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

    // New track - load and play
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlayerVisible(true);

    const audioUrl = getAudioUrl(track.audio_url);
    audio.src = audioUrl;
    audio.load();
    audio.play().catch(console.error);
  }, [currentTrack?.id, isPlaying, getAudioUrl, ensureAudioElement]);

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
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isPlayerVisible,
        playTrack,
        togglePlayPause,
        seek,
        setVolume,
        toggleMute,
        closePlayer,
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
