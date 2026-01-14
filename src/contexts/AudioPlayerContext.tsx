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

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 1;
      
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener("loadedmetadata", () => {
        const audioDuration = audioRef.current?.duration;
        if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        }
      });
      
      audioRef.current.addEventListener("durationchange", () => {
        const audioDuration = audioRef.current?.duration;
        if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        }
      });
      
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audioRef.current.addEventListener("play", () => {
        setIsPlaying(true);
      });
      
      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getAudioUrl = useCallback((url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    const { data } = supabase.storage.from("tracks").getPublicUrl(url);
    return data.publicUrl;
  }, []);

  const playTrack = useCallback((track: AudioTrack) => {
    if (!audioRef.current) return;
    
    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      return;
    }
    
    // New track - load and play
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlayerVisible(true);
    
    const audioUrl = getAudioUrl(track.audio_url);
    audioRef.current.src = audioUrl;
    audioRef.current.load();
    audioRef.current.play().catch(console.error);
  }, [currentTrack?.id, isPlaying, getAudioUrl]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((level: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = level;
    setVolumeState(level);
    setIsMuted(level === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
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
