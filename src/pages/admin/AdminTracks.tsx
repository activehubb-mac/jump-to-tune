import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Search, Trash2, Eye, EyeOff, Music, AlertTriangle 
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
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tracks by title or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tracks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>All Tracks</span>
            <Badge variant="outline">{filteredTracks?.length || 0} tracks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTracks?.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {track.cover_art_url ? (
                      <img
                        src={track.cover_art_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{track.title}</span>
                      {track.is_explicit && (
                        <Badge variant="outline" className="text-xs">E</Badge>
                      )}
                      {track.is_draft && (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>${Number(track.price).toFixed(2)}</span>
                      <span>•</span>
                      <span>{track.editions_sold}/{track.total_editions} sold</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Visibility */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDraftMutation.mutate({ 
                      trackId: track.id, 
                      isDraft: !track.is_draft 
                    })}
                  >
                    {track.is_draft ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Publish
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hide
                      </>
                    )}
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Delete Track
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{track.title}"? This action cannot be undone.
                          All associated purchases and earnings records will also be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(track.id)}
                        >
                          Delete Track
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
