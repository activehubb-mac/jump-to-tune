import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAudioDuration } from '@/lib/audioUtils';
import { registerTrack } from '@/hooks/useTrackRegistration';

export interface TrackFormData {
  title: string;
  description: string;
  genre: string;
  price: number;
  totalEditions: number;
  artistId?: string; // For labels uploading on behalf of artists
  moods?: string[];
  isExplicit?: boolean;
  displayLabelName?: string;
  previewDuration?: number;
}

export interface KaraokeData {
  enabled: boolean;
  instrumentalFile: File | null;
  lyrics: string;
  singModeEnabled?: boolean;
}

export interface TrackCreditsData {
  writers: string[];
  composers: string[];
  producers: string[];
  engineers: string[];
}

export interface UploadProgress {
  audio: number;
  cover: number;
  instrumental: number;
}

interface UseTrackUploadReturn {
  isUploading: boolean;
  uploadProgress: UploadProgress;
  uploadTrack: (
    formData: TrackFormData,
    audioFile: File,
    coverFile: File | null,
    karaokeData: KaraokeData,
    creditsData: TrackCreditsData,
    featureArtistIds: string[],
    isDraft: boolean,
    rightsConfirmed?: boolean
  ) => Promise<{ success: boolean; trackId?: string; recordingId?: string; error?: string }>;
}

export const useTrackUpload = (): UseTrackUploadReturn => {
  const { user, role } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    audio: 0,
    cover: 0,
    instrumental: 0,
  });

  const uploadFile = async (
    bucket: string,
    path: string,
    file: File,
    progressKey: keyof UploadProgress
  ): Promise<string | null> => {
    try {
      // Simulate progress (Supabase doesn't provide upload progress)
      setUploadProgress((prev) => ({ ...prev, [progressKey]: 30 }));

      // IMPORTANT: Provide contentType so Safari can stream reliably.
      // Supabase defaults to application/octet-stream if omitted, which can cause
      // Safari/iOS to buffer indefinitely.
      const contentType = file.type || (bucket === 'tracks' ? 'audio/mpeg' : undefined);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          ...(contentType ? { contentType } : {}),
          cacheControl: '3600',
        });

      if (error) throw error;

      setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));

      // Get public URL for all buckets
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }
  };

  const uploadTrack = async (
    formData: TrackFormData,
    audioFile: File,
    coverFile: File | null,
    karaokeData: KaraokeData,
    creditsData: TrackCreditsData,
    featureArtistIds: string[],
    isDraft: boolean,
    rightsConfirmed: boolean = false
  ): Promise<{ success: boolean; trackId?: string; recordingId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsUploading(true);
    setUploadProgress({ audio: 0, cover: 0, instrumental: 0 });

    try {
      // Helper to sanitize filenames for storage (remove special chars, spaces)
      const sanitizeFilename = (name: string): string => {
        return name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
          .replace(/_+/g, '_'); // Collapse multiple underscores
      };

      // Get audio duration
      const duration = await getAudioDuration(audioFile);

      // Generate unique file paths with sanitized filenames
      const timestamp = Date.now();
      const audioPath = `${user.id}/${timestamp}_${sanitizeFilename(audioFile.name)}`;
      const coverPath = coverFile
        ? `${user.id}/${timestamp}_${sanitizeFilename(coverFile.name)}`
        : null;
      const instrumentalPath = karaokeData.instrumentalFile
        ? `${user.id}/${timestamp}_instrumental_${sanitizeFilename(karaokeData.instrumentalFile.name)}`
        : null;

      // Upload audio file
      const audioUrl = await uploadFile('tracks', audioPath, audioFile, 'audio');
      if (!audioUrl) {
        throw new Error('Failed to upload audio file');
      }

      // Upload cover art if provided
      let coverArtUrl: string | null = null;
      if (coverFile && coverPath) {
        coverArtUrl = await uploadFile('covers', coverPath, coverFile, 'cover');
      }

      // Upload instrumental if karaoke enabled
      let instrumentalUrl: string | null = null;
      if (karaokeData.enabled && karaokeData.instrumentalFile && instrumentalPath) {
        instrumentalUrl = await uploadFile(
          'instrumentals',
          instrumentalPath,
          karaokeData.instrumentalFile,
          'instrumental'
        );
      }

      // Determine artist_id and label_id
      const isLabel = role === 'label';
      const artistId = isLabel && formData.artistId ? formData.artistId : user.id;
      const labelId = isLabel ? user.id : null;

      // Insert track record with new fields
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .insert({
          title: formData.title,
          description: formData.description || null,
          genre: formData.genre || null,
          price: formData.price,
          total_editions: formData.totalEditions,
          audio_url: audioUrl,
          cover_art_url: coverArtUrl,
          artist_id: artistId,
          label_id: labelId,
          duration,
          is_draft: isDraft,
          has_karaoke: karaokeData.enabled && !!instrumentalUrl,
          moods: formData.moods || [],
          is_explicit: formData.isExplicit || false,
          display_label_name: formData.displayLabelName || null,
          preview_duration: formData.previewDuration || 30,
        })
        .select('id')
        .single();

      if (trackError) {
        throw new Error(trackError.message);
      }

      // Insert karaoke data if enabled
      if (karaokeData.enabled && instrumentalUrl && track) {
        const { error: karaokeError } = await supabase
          .from('track_karaoke')
          .insert({
            track_id: track.id,
            instrumental_url: instrumentalUrl,
            lyrics: karaokeData.lyrics || null,
            sing_mode_enabled: karaokeData.singModeEnabled || false,
          });

        if (karaokeError) {
          console.error('Failed to save karaoke data:', karaokeError);
        }
      }

      // Insert track credits
      if (track) {
        const creditsToInsert: Array<{ track_id: string; role: string; name: string }> = [];
        
        creditsData.writers.forEach((name) => {
          creditsToInsert.push({ track_id: track.id, role: 'writer', name });
        });
        creditsData.composers.forEach((name) => {
          creditsToInsert.push({ track_id: track.id, role: 'composer', name });
        });
        creditsData.producers.forEach((name) => {
          creditsToInsert.push({ track_id: track.id, role: 'producer', name });
        });
        creditsData.engineers.forEach((name) => {
          creditsToInsert.push({ track_id: track.id, role: 'engineer', name });
        });

        if (creditsToInsert.length > 0) {
          const { error: creditsError } = await supabase
            .from('track_credits')
            .insert(creditsToInsert);

          if (creditsError) {
            console.error('Failed to save track credits:', creditsError);
          }
        }
      }

      // Insert feature artists
      if (track && featureArtistIds.length > 0) {
        const featuresToInsert = featureArtistIds.map((artistId) => ({
          track_id: track.id,
          artist_id: artistId,
        }));

        const { error: featuresError } = await supabase
          .from('track_features')
          .insert(featuresToInsert);

        if (featuresError) {
          console.error('Failed to save feature artists:', featuresError);
        }
      }

      // Notify followers about new release (only for published tracks, not drafts)
      if (track && !isDraft) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              notify_followers_of: artistId,
              title: 'New Release! 🎵',
              body: `${formData.title} is now available`,
              data: {
                type: 'new_release',
                track_id: track.id,
                artist_id: artistId,
              },
            }),
          });
        } catch (notifyError) {
          console.error('Failed to notify followers:', notifyError);
        }
      }

      // Register track for recording protection
      let recordingId: string | undefined;
      if (track) {
        const regResult = await registerTrack({
          trackId: track.id,
          audioFile,
          uploadedBy: user.id,
          rightsConfirmed,
        });
        recordingId = regResult.recordingId || undefined;
      }

      // Trigger stem separation if karaoke enabled but no instrumental uploaded
      if (track && karaokeData.enabled && !karaokeData.instrumentalFile) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (session) {
            // Set initial status to pending
            await supabase
              .from('track_karaoke')
              .update({ stem_separation_status: 'pending' })
              .eq('track_id', track.id);

            // Fire and forget — the edge function handles the async processing
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stem-separation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ track_id: track.id, audio_url: audioUrl }),
            }).catch((err) => console.error('Stem separation trigger failed:', err));
          }
        } catch (stemErr) {
          console.error('Failed to trigger stem separation:', stemErr);
        }
      }

      return { success: true, trackId: track?.id, recordingId };
    } catch (error) {
      console.error('Track upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadTrack,
  };
};
