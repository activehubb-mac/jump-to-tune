import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWhisperTranscribe() {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribe = async (trackId: string, audioUrl: string): Promise<string | null> => {
    setIsTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
        body: { track_id: trackId, audio_url: audioUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.lyrics ?? null;
    } catch (err) {
      console.error('Whisper transcribe error:', err);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  };

  return { transcribe, isTranscribing };
}
