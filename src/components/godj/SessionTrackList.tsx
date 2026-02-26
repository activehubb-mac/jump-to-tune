import { Music, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer, AudioTrack } from "@/contexts/AudioPlayerContext";

interface SessionTrack {
  id: string;
  embed_type: string;
  embed_url: string | null;
  position: number;
  tracks?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url?: string;
    duration?: number | null;
    price?: number;
    artist_id?: string;
    profiles?: { id?: string; display_name: string | null };
  } | null;
}

interface SessionTrackListProps {
  tracks: SessionTrack[];
}

export function SessionTrackList({ tracks }: SessionTrackListProps) {
  const { playTrack, currentTrack, isPlaying, addToQueue } = useAudioPlayer();

  const handlePlay = (track: SessionTrack) => {
    if (!track.tracks?.audio_url) return;

    const audioTrack: AudioTrack = {
      id: track.tracks.id,
      title: track.tracks.title,
      audio_url: track.tracks.audio_url,
      cover_art_url: track.tracks.cover_art_url,
      duration: track.tracks.duration,
      price: track.tracks.price,
      artist: {
        id: track.tracks.artist_id || track.tracks.profiles?.id || "",
        display_name: track.tracks.profiles?.display_name || "Unknown",
      },
    };

    playTrack(audioTrack);
  };

  const handlePlayAll = () => {
    const playableTracks = tracks.filter(t => t.tracks?.audio_url);
    if (playableTracks.length === 0) return;

    // Play the first track
    handlePlay(playableTracks[0]);

    // Queue the rest
    playableTracks.slice(1).forEach(t => {
      if (!t.tracks?.audio_url) return;
      addToQueue({
        id: t.tracks.id,
        title: t.tracks.title,
        audio_url: t.tracks.audio_url,
        cover_art_url: t.tracks.cover_art_url,
        duration: t.tracks.duration,
        price: t.tracks.price,
        artist: {
          id: t.tracks.artist_id || t.tracks.profiles?.id || "",
          display_name: t.tracks.profiles?.display_name || "Unknown",
        },
      });
    });
  };

  if (!tracks.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No tracks in this session yet</p>
      </div>
    );
  }

  const hasPlayable = tracks.some(t => t.tracks?.audio_url);

  return (
    <div className="space-y-2">
      {hasPlayable && (
        <Button variant="outline" size="sm" className="mb-2" onClick={handlePlayAll}>
          <Play className="w-4 h-4 mr-1.5" />
          Play Session
        </Button>
      )}
      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack?.id === track.tracks?.id;
          const isPlayable = track.embed_type === "jumtunes" && track.tracks?.audio_url;

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                isCurrentTrack ? "bg-primary/10" : "hover:bg-muted/30"
              }`}
            >
              <span className="w-6 text-xs text-muted-foreground text-right font-mono">
                {index + 1}
              </span>

              {track.embed_type === "jumtunes" && track.tracks ? (
                <>
                  <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0 relative">
                    {track.tracks.cover_art_url ? (
                      <img src={track.tracks.cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{track.tracks.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.tracks.profiles?.display_name || "Unknown"}
                    </p>
                  </div>
                  {isPlayable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePlay(track)}
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {track.embed_type === "spotify" ? "Spotify" : track.embed_type === "apple_music" ? "Apple Music" : "YouTube"} Embed
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{track.embed_url}</p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
