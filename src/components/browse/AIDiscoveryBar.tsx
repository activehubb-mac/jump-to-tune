import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Play, Pause, X } from "lucide-react";
import { useAIDiscovery } from "@/hooks/useAIDiscovery";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function AIDiscoveryBar() {
  const [query, setQuery] = useState("");
  const { result, isSearching, search, clear } = useAIDiscovery();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) search(query);
  };

  const handleClear = () => {
    setQuery("");
    clear();
    inputRef.current?.focus();
  };

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "dark cinematic trap" or "futuristic R&B vibes"...'
            className="pl-10 pr-10 bg-muted/50 border-border"
          />
          {(query || result) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSearching || query.trim().length < 3}
          className="gradient-accent shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              Discover
            </>
          )}
        </Button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-4 animate-fade-in">
          {result.description && (
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary shrink-0" />
              {result.description}
            </p>
          )}

          {result.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tracks found matching that vibe. Try a different description!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {result.tracks.slice(0, 10).map((track) => {
                const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
                return (
                  <Link
                    key={track.id}
                    to={`/browse`}
                    onClick={(e) => {
                      e.preventDefault();
                      playTrack({
                        id: track.id,
                        title: track.title,
                        audio_url: track.audio_url,
                        cover_art_url: track.cover_art_url,
                        duration: track.duration,
                        price: track.price,
                        artist: { id: track.artist_id, display_name: track.artist_name },
                      });
                    }}
                    className="glass-card p-3 group cursor-pointer hover:bg-primary/10 transition-all"
                  >
                    <div className="aspect-square rounded-lg bg-muted/50 mb-2 relative overflow-hidden">
                      {track.cover_art_url ? (
                        <img
                          src={track.cover_art_url}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isCurrentlyPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
