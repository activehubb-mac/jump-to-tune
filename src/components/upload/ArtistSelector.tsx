import { useEffect, useState } from 'react';
import { Users, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Artist {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ArtistSelectorProps {
  value: string | undefined;
  onChange: (artistId: string) => void;
  disabled?: boolean;
}

export const ArtistSelector = ({ value, onChange, disabled }: ArtistSelectorProps) => {
  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRosterArtists = async () => {
      if (!user) return;

      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('label_roster')
        .select(`
          artist_id,
          profiles!label_roster_artist_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('label_id', user.id)
        .eq('status', 'active');

      if (!error && data) {
        const rosterArtists = data
          .map((item) => item.profiles as unknown as Artist)
          .filter((profile): profile is Artist => profile !== null);
        setArtists(rosterArtists);
      }
      
      setIsLoading(false);
    };

    fetchRosterArtists();
  }, [user]);

  if (artists.length === 0 && !isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No Artists in Roster</p>
            <p className="text-sm text-muted-foreground">
              Add artists to your roster before uploading tracks for them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-foreground">Select Artist</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Choose which artist from your roster this track belongs to. The artist will be credited on the track.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="bg-muted/50 border-glass-border">
          <SelectValue placeholder={isLoading ? "Loading artists..." : "Select an artist"} />
        </SelectTrigger>
        <SelectContent>
          {artists.map((artist) => (
            <SelectItem key={artist.id} value={artist.id}>
              <div className="flex items-center gap-2">
                {artist.avatar_url ? (
                  <img 
                    src={artist.avatar_url} 
                    alt="" 
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span>{artist.display_name || 'Unnamed Artist'}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
