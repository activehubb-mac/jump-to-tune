import { useEffect } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export function useAudioKeyboardShortcuts() {
  const {
    isPlayerVisible,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
  } = useAudioPlayer();

  useEffect(() => {
    if (!isPlayerVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;

        case "ArrowLeft":
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;

        case "ArrowRight":
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;

        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;

        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;

        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;

        case "KeyN":
          e.preventDefault();
          playNext();
          break;

        case "KeyP":
          e.preventDefault();
          playPrevious();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlayerVisible,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
  ]);
}
