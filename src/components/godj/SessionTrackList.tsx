import { Music, ExternalLink } from "lucide-react";

interface SessionTrack {
  id: string;
  embed_type: string;
  embed_url: string | null;
  position: number;
  tracks?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    profiles?: { display_name: string | null };
  } | null;
}

interface SessionTrackListProps {
  tracks: SessionTrack[];
}

export function SessionTrackList({ tracks }: SessionTrackListProps) {
  if (!tracks.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No tracks in this session yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
        >
          <span className="w-6 text-xs text-muted-foreground text-right font-mono">
            {index + 1}
          </span>

          {track.embed_type === "jumtunes" && track.tracks ? (
            <>
              <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0">
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
                  {(track.tracks as any)?.profiles?.display_name || "Unknown"}
                </p>
              </div>
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
      ))}
    </div>
  );
}
