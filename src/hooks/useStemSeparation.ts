import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useStemSeparation = (trackId?: string) => {
  const [isTriggering, setIsTriggering] = useState(false);

  const { data: status, refetch } = useQuery({
    queryKey: ['stem-separation-status', trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data } = await supabase
        .from('track_karaoke')
        .select('stem_separation_status, instrumental_url, vocals_url')
        .eq('track_id', trackId)
        .maybeSingle();
      return data;
    },
    enabled: !!trackId,
    refetchInterval: (query) => {
      const status = query.state.data?.stem_separation_status;
      if (status === 'processing' || status === 'pending') return 5000;
      return false;
    },
  });

  const triggerSeparation = useCallback(async (trackId: string, audioUrl: string) => {
    setIsTriggering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stem-separation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ track_id: trackId, audio_url: audioUrl }),
        }
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      refetch();
      return result;
    } finally {
      setIsTriggering(false);
    }
  }, [refetch]);

  return {
    isTriggering,
    separationStatus: status?.stem_separation_status ?? null,
    instrumentalUrl: status?.instrumental_url ?? null,
    vocalsUrl: status?.vocals_url ?? null,
    triggerSeparation,
    refetch,
  };
};
