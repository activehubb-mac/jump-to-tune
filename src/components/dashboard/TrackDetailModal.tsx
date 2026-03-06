import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Disc3, Play, Pause, Volume2, VolumeX, Users, Mic2, Shield, Download } from "lucide-react";
import { formatPrice, formatEditions } from "@/lib/formatters";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { DownloadButton } from "@/components/download/DownloadButton";
import { usePurchases } from "@/hooks/usePurchases";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTrackRegistration } from "@/hooks/useTrackRegistration";

interface Track {
  id: string;
  title: string;
  description?: string | null;
  cover_art_url: string | null;
  audio_url: string;
  price: number;
  editions_sold: number;
  total_editions: number;
  genre?: string | null;
  duration?: number | null;
  moods?: string[];
  is_explicit?: boolean;
  artist?: {
    id: string;
    display_name: string | null;
  };
}

interface TrackDetailModalProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrackDetailModal({
  track,
  open,
  onOpenChange,
}: TrackDetailModalProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playTrack,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();
  const { isOwned } = usePurchases();
  const { user } = useAuth();

  // Fetch track registration
  const { data: registration } = useQuery({
    queryKey: ["track-registration", track?.id],
    queryFn: () => fetchTrackRegistration(track!.id),
    enabled: !!track?.id && open,
  });

  // Fetch track credits
  const { data: trackCredits } = useQuery({
    queryKey: ["track-credits", track?.id],
    queryFn: async () => {
      if (!track?.id) return [];
      const { data, error } = await supabase
        .from("track_credits")
        .select("*")
        .eq("track_id", track.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!track?.id && open,
  });

  // Fetch feature artists
  const { data: featureArtists } = useQuery({
    queryKey: ["track-features", track?.id],
    queryFn: async () => {
      if (!track?.id) return [];
      const { data, error } = await supabase
        .from("track_features")
        .select("artist_id")
        .eq("track_id", track.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const artistIds = data.map((f) => f.artist_id);
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds);

        return profiles || [];
      }
      return [];
    },
    enabled: !!track?.id && open,
  });

  // Check if this track is the currently playing track
  const isThisTrackPlaying = currentTrack?.id === track?.id;
  const displayDuration = isThisTrackPlaying ? duration : (track?.duration || 0);
  const displayCurrentTime = isThisTrackPlaying ? currentTime : 0;
  const displayIsPlaying = isThisTrackPlaying && isPlaying;

  const handlePlayPause = () => {
    if (!track) return;
    
    if (isThisTrackPlaying) {
      togglePlayPause();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        artist: track.artist,
      });
    }
  };

  const handleSeek = (value: number[]) => {
    if (isThisTrackPlaying) {
      seek(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  if (!track) return null;

  // Group credits by category for display like music apps
  const creditCategories: { label: string; roles: string[]; entries: { name: string; role: string }[] }[] = [
    { label: "Writing & Arrangement", roles: ["writer", "songwriter", "lyricist", "composer", "arranger"], entries: [] },
    { label: "Production & Engineering", roles: ["producer", "studio producer", "engineer", "mixing engineer", "mastering engineer", "recording engineer", "co-producer"], entries: [] },
    { label: "Performance", roles: ["vocalist", "musician", "instrumentalist", "guitarist", "drummer", "bassist", "pianist", "keyboardist"], entries: [] },
    { label: "Other", roles: [], entries: [] },
  ];

  trackCredits?.forEach((credit) => {
    const roleLower = credit.role.toLowerCase();
    let placed = false;
    for (const cat of creditCategories) {
      if (cat.roles.some(r => roleLower.includes(r))) {
        cat.entries.push({ name: credit.name, role: credit.role });
        placed = true;
        break;
      }
    }
    if (!placed) {
      creditCategories[creditCategories.length - 1].entries.push({ name: credit.name, role: credit.role });
    }
  });

  const filledCategories = creditCategories.filter(c => c.entries.length > 0);

  const hasCredits = trackCredits && trackCredits.length > 0;
  const hasFeatures = featureArtists && featureArtists.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{track.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6">
          {/* Cover Art */}
          <div className="w-full aspect-square max-w-[280px] rounded-xl overflow-hidden bg-muted/50 relative">
            {track.cover_art_url ? (
              <img
                src={track.cover_art_url}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Disc3 className="w-24 h-24 text-muted-foreground/50" />
              </div>
            )}
            {/* Explicit Badge */}
            {track.is_explicit && (
              <Badge 
                variant="destructive" 
                className="absolute top-3 left-3 text-xs"
              >
                Explicit
              </Badge>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold text-foreground mb-1">{track.title}</h2>
            {track.artist && (
              <Link 
                to={`/artist/${track.artist.id}`}
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => onOpenChange(false)}
              >
                {track.artist.display_name || "Unknown Artist"}
              </Link>
            )}
            
            {/* Feature Artists */}
            {hasFeatures && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">feat.</span>
                <div className="flex items-center gap-1">
                  {featureArtists.map((artist, index) => (
                    <span key={artist.id}>
                      <Link
                        to={`/artist/${artist.id}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => onOpenChange(false)}
                      >
                        {artist.display_name}
                      </Link>
                      {index < featureArtists.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Genre & Moods */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {track.genre && (
                <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary">
                  {track.genre}
                </span>
              )}
              {track.moods?.map((mood) => (
                <span 
                  key={mood}
                  className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                >
                  {mood}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {track.description && (
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {track.description}
            </p>
          )}

          {/* Credits - Grouped by Category */}
          {hasCredits && (
            <div className="w-full glass-card p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mic2 className="h-4 w-4 text-primary" />
                Credits
              </div>
              
              {/* Main Artist */}
              {track.artist && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Artist</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{track.artist.display_name || "Unknown Artist"}</p>
                      <p className="text-xs text-muted-foreground">Main Artist</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Featured Artists in Credits */}
              {hasFeatures && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Featured Artists</h4>
                  <div className="space-y-1">
                    {featureArtists.map((fa) => (
                      <div key={fa.id}>
                        <p className="text-sm text-foreground">{fa.display_name}</p>
                        <p className="text-xs text-muted-foreground">Featured Artist</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Credits */}
              {filledCategories.map((cat) => (
                <div key={cat.label}>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{cat.label}</h4>
                  <div className="space-y-1">
                    {cat.entries.map((entry, i) => (
                      <div key={`${entry.name}-${i}`}>
                        <p className="text-sm text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{entry.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show artist info even without credits */}
          {!hasCredits && track.artist && (
            <div className="w-full glass-card p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mic2 className="h-4 w-4 text-primary" />
                Artist
              </div>
              <div>
                <p className="text-sm text-foreground">{track.artist.display_name || "Unknown Artist"}</p>
                <p className="text-xs text-muted-foreground">Main Artist</p>
              </div>
              {hasFeatures && (
                <div className="mt-2 space-y-1">
                  {featureArtists.map((fa) => (
                    <div key={fa.id}>
                      <p className="text-sm text-foreground">{fa.display_name}</p>
                      <p className="text-xs text-muted-foreground">Featured Artist</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recording Protection */}
          {registration?.recording_id && (
            <div className="w-full glass-card p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Recording Protection
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Recording ID</p>
                  <p className="text-sm font-mono text-primary font-semibold">
                    {registration.recording_id}
                  </p>
                </div>
                {/* Show download certificate button only for track owner */}
                {user && (track.artist?.id === user.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={async () => {
                      const session = await supabase.auth.getSession();
                      const token = session.data.session?.access_token;
                      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`;
                      const res = await fetch(url, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ track_id: track.id }),
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `JumTunes-Certificate-${registration.recording_id}.html`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                      }
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Certificate
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Price & Editions */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Price</p>
              <p className="font-semibold text-primary">{formatPrice(track.price)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-muted-foreground">Editions</p>
              <p className="font-semibold text-foreground">
                {formatEditions(track.editions_sold, track.total_editions)}
              </p>
            </div>
          </div>

          {/* Download/Purchase Button */}
          <DownloadButton
            track={{
              id: track.id,
              title: track.title,
              cover_art_url: track.cover_art_url,
              price: track.price,
              audio_url: track.audio_url,
              artist: track.artist ? { display_name: track.artist.display_name } : undefined,
            }}
            isOwned={isOwned(track.id)}
            variant="default"
            size="lg"
            className="w-full gradient-accent neon-glow-subtle"
          />

          {/* Audio Player */}
          <div className="w-full space-y-3 glass-card p-4 rounded-xl">
            {/* Progress Bar */}
            <Slider
              value={[displayCurrentTime]}
              max={displayDuration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />

            {/* Time Display */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(displayCurrentTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
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

              {/* Play/Pause Button */}
              <Button
                size="lg"
                className="rounded-full w-14 h-14 gradient-accent neon-glow-subtle"
                onClick={handlePlayPause}
              >
                {displayIsPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              {/* Spacer for symmetry */}
              <div className="w-[108px]" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
