import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAudioDuration } from '@/lib/audioUtils';

export interface TrackFormData {
  title: string;
  description: string;
  genre: string;
  price: number;
  totalEditions: number;
  artistId?: string; // For labels uploading on behalf of artists
}

export interface KaraokeData {
  enabled: boolean;
  instrumentalFile: File | null;
  lyrics: string;
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
    isDraft: boolean
  ) => Promise<{ success: boolean; trackId?: string; error?: string }>;
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

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) throw error;

      setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));

      // Get public URL for public buckets
      if (bucket === 'covers' || bucket === 'banners') {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      }

      // Return path for private buckets
      return path;
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
    isDraft: boolean
  ): Promise<{ success: boolean; trackId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsUploading(true);
    setUploadProgress({ audio: 0, cover: 0, instrumental: 0 });

    try {
      // Get audio duration
      const duration = await getAudioDuration(audioFile);

      // Generate unique file paths
      const timestamp = Date.now();
      const audioPath = `${user.id}/${timestamp}_${audioFile.name}`;
      const coverPath = coverFile
        ? `${user.id}/${timestamp}_${coverFile.name}`
        : null;
      const instrumentalPath = karaokeData.instrumentalFile
        ? `${user.id}/${timestamp}_instrumental_${karaokeData.instrumentalFile.name}`
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

      // Insert track record
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
          });

        if (karaokeError) {
          console.error('Failed to save karaoke data:', karaokeError);
        }
      }

      return { success: true, trackId: track?.id };
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
