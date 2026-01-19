import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KaraokeData {
  id: string;
  track_id: string;
  instrumental_url: string;
  lyrics: string | null;
  created_at: string;
}

/**
 * Hook to fetch karaoke data for a track
 */
export function useKaraokeData(trackId: string | undefined | null) {
  return useQuery({
    queryKey: ['karaoke', trackId],
    queryFn: async (): Promise<KaraokeData | null> => {
      if (!trackId) return null;

      const { data, error } = await supabase
        .from('track_karaoke')
        .select('*')
        .eq('track_id', trackId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching karaoke data:', error);
        return null;
      }

      return data;
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get the public URL for an instrumental file
 */
export function getInstrumentalUrl(storedUrl: string): string {
  // If already a full URL, return as is
  if (storedUrl.startsWith('http')) {
    return storedUrl;
  }
  
  // Get public URL from Supabase storage
  const { data } = supabase.storage.from('instrumentals').getPublicUrl(storedUrl);
  return data.publicUrl;
}
