import { supabase } from '@/integrations/supabase/client';
import { generateAudioHash, getBrowserCountry } from '@/lib/audioUtils';

export interface TrackRegistrationData {
  trackId: string;
  audioFile: File;
  uploadedBy: string;
  rightsConfirmed: boolean;
}

export interface TrackRegistrationResult {
  recordingId: string | null;
  audioHash: string | null;
  error?: string;
}

/**
 * Register a track in the track_registrations table with audio fingerprint.
 * Returns the generated recording ID and audio hash.
 */
export const registerTrack = async (
  data: TrackRegistrationData
): Promise<TrackRegistrationResult> => {
  try {
    const audioHash = await generateAudioHash(data.audioFile);
    const country = getBrowserCountry();

    const { data: registration, error } = await supabase
      .from('track_registrations' as any)
      .insert({
        track_id: data.trackId,
        audio_hash: audioHash,
        uploaded_by: data.uploadedBy,
        country,
        rights_confirmed: data.rightsConfirmed,
      })
      .select('recording_id')
      .single();

    if (error) {
      console.error('Failed to register track:', error);
      return { recordingId: null, audioHash, error: error.message };
    }

    return {
      recordingId: (registration as any)?.recording_id || null,
      audioHash,
    };
  } catch (err) {
    console.error('Track registration error:', err);
    return {
      recordingId: null,
      audioHash: null,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
};

/**
 * Fetch the registration data for a track
 */
export const fetchTrackRegistration = async (trackId: string) => {
  const { data, error } = await supabase
    .from('track_registrations' as any)
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch track registration:', error);
    return null;
  }

  if (!data) return null;

  const reg = data as unknown as {
    id: string;
    track_id: string;
    recording_id: string;
    audio_hash: string;
    uploaded_by: string;
    upload_timestamp: string;
    country: string;
    rights_confirmed: boolean;
  };

  return reg;
};
