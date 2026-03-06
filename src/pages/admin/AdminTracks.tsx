import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Search, Trash2, Eye, EyeOff, Music, AlertTriangle, Mic, MicOff 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminTracks() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch all tracks
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          cover_art_url,
          price,
          editions_sold,
          total_editions,
          is_draft,
          is_explicit,
          created_at,
          artist_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch sing mode status for all tracks
  const { data: karaokeData = [] } = useQuery({
    queryKey: ['admin-track-karaoke'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_karaoke')
        .select('track_id, sing_mode_enabled');
      if (error) throw error;
      return data ?? [];
    },
  });

  const singModeMap = new Map(karaokeData.map(k => [k.track_id, k.sing_mode_enabled]));

  // Toggle draft status (hide/show)
  const toggleDraftMutation = useMutation({
    mutationFn: async ({ trackId, isDraft }: { trackId: string; isDraft: boolean }) => {
      const { error } = await supabase
        .from('tracks')
        .update({ is_draft: isDraft })
        .eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
      toast.success('Track visibility updated');
    },
    onError: (error) => {
      toast.error('Failed to update track');
      console.error(error);
    },
  });

  // Toggle sing mode
  const toggleSingModeMutation = useMutation({
    mutationFn: async ({ trackId, enabled }: { trackId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('track_karaoke')
        .update({ sing_mode_enabled: enabled })
        .eq('track_id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-track-karaoke'] });
      toast.success('Sing Mode updated');
    },
    onError: () => toast.error('Failed to update Sing Mode'),

  // Delete track
  const deleteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
      toast.success('Track deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete track');
      console.error(error);
    },
  });

  const filteredTracks = tracks?.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tracks List */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            <span>All Tracks</span>
            <Badge variant="outline">{filteredTracks?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="space-y-2">
            {filteredTracks?.map((track) => (
              <div
                key={track.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg glass-card hover:bg-primary/5 transition-colors"
              >
                {/* Track Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {track.cover_art_url ? (
                      <img
                        src={track.cover_art_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm md:text-base truncate max-w-[150px] sm:max-w-none">
                        {track.title}
                      </span>
                      {track.is_explicit && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">E</Badge>
                      )}
                      {track.is_draft && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>${Number(track.price).toFixed(2)}</span>
                      <span>•</span>
                      <span>{track.editions_sold}/{track.total_editions}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Toggle Sing Mode */}
                  {singModeMap.has(track.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={singModeMap.get(track.id) ? 'Disable Sing Mode' : 'Enable Sing Mode'}
                      onClick={() => toggleSingModeMutation.mutate({
                        trackId: track.id,
                        enabled: !singModeMap.get(track.id),
                      })}
                    >
                      {singModeMap.get(track.id) ? (
                        <Mic className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                  {/* Toggle Visibility */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => toggleDraftMutation.mutate({ 
                      trackId: track.id, 
                      isDraft: !track.is_draft 
                    })}
                  >
                    {track.is_draft ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        <span className="hidden xs:inline">Publish</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        <span className="hidden xs:inline">Hide</span>
                      </>
                    )}
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Delete Track
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{track.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(track.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            {filteredTracks?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tracks found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}