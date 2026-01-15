import { useEffect, useState } from 'react';
import { Users, Info, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
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

  // Check if there are pending invites that haven't been accepted yet
  const [hasPendingArtists, setHasPendingArtists] = useState(false);
  
  useEffect(() => {
    const checkPending = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('label_roster')
        .select('id')
        .eq('label_id', user.id)
        .eq('status', 'pending')
        .limit(1);
      
      setHasPendingArtists((data?.length ?? 0) > 0);
    };
    
    if (artists.length === 0 && !isLoading) {
      checkPending();
    }
  }, [user, artists.length, isLoading]);

  if (artists.length === 0 && !isLoading) {
    return (
      <div className="glass-card p-4 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
            {hasPendingArtists ? (
              <Clock className="w-5 h-5 text-yellow-500" />
            ) : (
              <Users className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {hasPendingArtists ? "Waiting for Artist Approval" : "No Artists in Roster"}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              {hasPendingArtists 
                ? "You have pending invitations. Artists must accept your invitation before you can upload tracks for them."
                : "Add artists to your roster before uploading tracks for them."}
            </p>
            <Link 
              to="/label/dashboard" 
              className="text-sm text-accent hover:underline"
            >
              {hasPendingArtists ? "View Pending Invites →" : "Go to Dashboard →"}
            </Link>
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
