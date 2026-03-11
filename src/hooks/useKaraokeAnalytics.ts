import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useKaraokeAnalytics = (artistId?: string) => {
  return useQuery({
    queryKey: ['karaoke-analytics', artistId],
    queryFn: async () => {
      if (!artistId) return null;

      // Get artist's tracks that have karaoke enabled
      const { data: karaokeTracks } = await supabase
        .from('track_karaoke')
        .select('track_id, sing_mode_enabled, stem_separation_status')
        .in('track_id', 
          (await supabase.from('tracks').select('id').eq('artist_id', artistId)).data?.map(t => t.id) ?? []
        );

      // Get sing mode videos for artist's tracks
      const trackIds = karaokeTracks?.map(t => t.track_id) ?? [];
      
      let totalVideos = 0;
      let videosByTrack: Record<string, number> = {};

      if (trackIds.length > 0) {
        const { data: videos, count } = await supabase
          .from('sing_mode_videos')
          .select('id, track_id', { count: 'exact' })
          .in('track_id', trackIds);

        totalVideos = count ?? 0;
        
        videos?.forEach(v => {
          videosByTrack[v.track_id] = (videosByTrack[v.track_id] || 0) + 1;
        });
      }

      // Get track titles for the most popular
      let mostPopularTrack: { title: string; count: number } | null = null;
      if (Object.keys(videosByTrack).length > 0) {
        const topTrackId = Object.entries(videosByTrack).sort(([,a], [,b]) => b - a)[0][0];
        const { data: trackData } = await supabase
          .from('tracks')
          .select('title')
          .eq('id', topTrackId)
          .single();
        
        mostPopularTrack = {
          title: trackData?.title ?? 'Unknown',
          count: videosByTrack[topTrackId],
        };
      }

      return {
        totalKaraokeTracks: karaokeTracks?.length ?? 0,
        totalVideos,
        mostPopularTrack,
        separationsPending: karaokeTracks?.filter(t => t.stem_separation_status === 'processing').length ?? 0,
      };
    },
    enabled: !!artistId,
  });
};
