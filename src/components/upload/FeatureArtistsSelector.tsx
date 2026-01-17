import { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useArtistSearch } from '@/hooks/useArtistSearch';
import { InfoTooltip } from './InfoTooltip';

interface FeatureArtist {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface FeatureArtistsSelectorProps {
  selectedArtists: FeatureArtist[];
  onChange: (artists: FeatureArtist[]) => void;
  excludeArtistId?: string; // Exclude the main artist from feature selection
}

const FeatureArtistsSelector = ({
  selectedArtists,
  onChange,
  excludeArtistId,
}: FeatureArtistsSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { data: artists = [], isLoading } = useArtistSearch(searchQuery);

  const filteredArtists = artists.filter(
    (artist) =>
      artist.id !== excludeArtistId &&
      !selectedArtists.some((selected) => selected.id === artist.id)
  );

  const addArtist = (artist: FeatureArtist) => {
    onChange([...selectedArtists, artist]);
    setSearchQuery('');
    setIsSearching(false);
  };

  const removeArtist = (artistId: string) => {
    onChange(selectedArtists.filter((a) => a.id !== artistId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Feature Artists</Label>
        <InfoTooltip content="Add other artists who are featured on this track. They'll be credited and the track will appear on their profiles." />
      </div>

      {selectedArtists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedArtists.map((artist) => (
            <Badge
              key={artist.id}
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={artist.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {artist.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span>{artist.display_name}</span>
              <button
                type="button"
                onClick={() => removeArtist(artist.id)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            placeholder="Search artists to feature..."
            className="pl-10"
          />
        </div>

        {isSearching && searchQuery.length >= 2 && (
          <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg">
            <ScrollArea className="max-h-48">
              {isLoading ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Searching...
                </div>
              ) : filteredArtists.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No artists found
                </div>
              ) : (
                <div className="p-1">
                  {filteredArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() =>
                        addArtist({
                          id: artist.id,
                          display_name: artist.display_name || 'Unknown',
                          avatar_url: artist.avatar_url,
                        })
                      }
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback>
                          {artist.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{artist.display_name}</span>
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {isSearching && (
        <button
          type="button"
          onClick={() => {
            setIsSearching(false);
            setSearchQuery('');
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel search
        </button>
      )}
    </div>
  );
};

export default FeatureArtistsSelector;
