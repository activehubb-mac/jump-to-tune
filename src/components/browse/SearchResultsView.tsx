import { Link } from "react-router-dom";
import { Disc3, Users, Music, Building2, Album, Loader2, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice, formatCompactNumber } from "@/lib/formatters";
import type { BrowseSearchResults } from "@/hooks/useBrowseSearch";

interface SearchResultsViewProps {
  query: string;
  results: Omit<BrowseSearchResults, "isLoading" | "hasResults">;
  isLoading: boolean;
}

export function SearchResultsView({ query, results, isLoading }: SearchResultsViewProps) {
  const { artists, labels, albums, tracks } = results;
  const hasResults = artists.length > 0 || labels.length > 0 || albums.length > 0 || tracks.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-16">
        <SearchX className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground">
          No matches for "{query}". Try different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Artists Section */}
      {artists.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Artists
            <span className="text-sm font-normal text-muted-foreground">({artists.length})</span>
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="flex-shrink-0 w-36 glass-card p-4 hover:bg-primary/10 transition-all group text-center"
              >
                <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-border group-hover:ring-primary transition-all">
                  <AvatarImage src={artist.avatar_url || undefined} alt={artist.display_name || "Artist"} />
                  <AvatarFallback className="bg-muted text-xl">
                    {artist.display_name?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {artist.display_name || "Unknown Artist"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {artist.trackCount} tracks • {formatCompactNumber(artist.followerCount)} fans
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Labels Section */}
      {labels.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Labels
            <span className="text-sm font-normal text-muted-foreground">({labels.length})</span>
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {labels.map((label) => (
              <Link
                key={label.id}
                to={`/label/${label.id}`}
                className="flex-shrink-0 w-36 glass-card p-4 hover:bg-primary/10 transition-all group text-center"
              >
                <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-border group-hover:ring-primary transition-all">
                  <AvatarImage src={label.avatar_url || undefined} alt={label.display_name || "Label"} />
                  <AvatarFallback className="bg-muted text-xl">
                    <Building2 className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {label.display_name || "Unknown Label"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {label.artistCount} artists • {label.trackCount} tracks
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Albums & EPs Section */}
      {albums.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Album className="w-5 h-5 text-primary" />
            Albums & EPs
            <span className="text-sm font-normal text-muted-foreground">({albums.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="glass-card group hover:bg-primary/10 transition-all overflow-hidden"
              >
                <div className="aspect-square relative overflow-hidden">
                  {album.cover_art_url ? (
                    <img
                      src={album.cover_art_url}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <Album className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-sm">
                    {album.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artist_name || "Unknown Artist"}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize mt-1 inline-block">
                    {album.release_type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tracks Section */}
      {tracks.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Tracks
            <span className="text-sm font-normal text-muted-foreground">({tracks.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track) => (
              <Link
                key={track.id}
                to={`/browse?track=${track.id}`}
                className="glass-card p-3 group hover:bg-primary/10 transition-all"
              >
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                  {track.cover_art_url ? (
                    <img
                      src={track.cover_art_url}
                      alt={track.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Disc3 className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
                  {track.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist_name || "Unknown Artist"}
                </p>
                <span className="text-sm font-medium text-primary mt-1 block">
                  {formatPrice(track.price)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
