import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ReleaseType } from '@/components/upload/ReleaseTypeSelector';
import { AlbumTrackData } from '@/components/upload/AlbumTrackRow';

export interface AlbumFormData {
  title: string;
  description: string;
  genre: string;
  releaseType: ReleaseType;
  artistId?: string;
}

export interface AlbumUploadProgress {
  cover: number;
  tracks: Record<string, number>; // trackId -> progress
  overall: number;
}

interface UseAlbumUploadReturn {
  isUploading: boolean;
  uploadProgress: AlbumUploadProgress;
  uploadAlbum: (
    formData: AlbumFormData,
    coverFile: File | null,
    tracks: AlbumTrackData[],
    isDraft: boolean
  ) => Promise<{ success: boolean; albumId?: string; error?: string }>;
}

export const useAlbumUpload = (): UseAlbumUploadReturn => {
  const { user, role } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<AlbumUploadProgress>({
    cover: 0,
    tracks: {},
    overall: 0,
  });

  const sanitizeFilename = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
  };

  const uploadFile = async (
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }
  };

  const uploadAlbum = async (
    formData: AlbumFormData,
    coverFile: File | null,
    tracks: AlbumTrackData[],
    isDraft: boolean
  ): Promise<{ success: boolean; albumId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (tracks.length === 0) {
      return { success: false, error: 'No tracks to upload' };
    }

    setIsUploading(true);
    setUploadProgress({ cover: 0, tracks: {}, overall: 0 });

    try {
      const timestamp = Date.now();
      const isLabel = role === 'label';
      const artistId = isLabel && formData.artistId ? formData.artistId : user.id;
      const labelId = isLabel ? user.id : null;

      // Upload cover art
      let coverArtUrl: string | null = null;
      if (coverFile) {
        const coverPath = `${user.id}/${timestamp}_album_${sanitizeFilename(coverFile.name)}`;
        coverArtUrl = await uploadFile('covers', coverPath, coverFile);
        setUploadProgress(prev => ({ ...prev, cover: 100 }));
      }

      // Calculate total price from all tracks
      const totalPrice = tracks.reduce((sum, t) => sum + (t.price || 0), 0);

      // Create album record
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          title: formData.title,
          description: formData.description || null,
          genre: formData.genre || null,
          release_type: formData.releaseType,
          cover_art_url: coverArtUrl,
          artist_id: artistId,
          label_id: labelId,
          is_draft: isDraft,
          total_price: totalPrice,
        })
        .select('id')
        .single();

      if (albumError) {
        throw new Error(albumError.message);
      }

      // Upload each track
      const totalTracks = tracks.length;
      let completedTracks = 0;

      for (const track of tracks) {
        // Upload audio file
        const audioPath = `${user.id}/${timestamp}_${track.trackNumber}_${sanitizeFilename(track.file.name)}`;
        const audioUrl = await uploadFile('tracks', audioPath, track.file);

        if (!audioUrl) {
          console.error(`Failed to upload track: ${track.title}`);
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          tracks: { ...prev.tracks, [track.id]: 100 },
          overall: Math.round(((completedTracks + 1) / totalTracks) * 100),
        }));

        // Insert track record
        const { data: insertedTrack, error: trackError } = await supabase
          .from('tracks')
          .insert({
            title: track.title,
            audio_url: audioUrl,
            cover_art_url: coverArtUrl, // Use album cover for all tracks
            artist_id: artistId,
            label_id: labelId,
            album_id: album.id,
            track_number: track.trackNumber,
            duration: track.duration,
            price: track.price || 0,
            total_editions: 100, // Default editions
            is_draft: isDraft,
            genre: formData.genre || null,
            has_karaoke: track.hasKaraoke || false,
            display_label_name: track.credits?.displayLabelName || null,
          })
          .select('id')
          .single();

        if (trackError) {
          console.error(`Failed to insert track: ${track.title}`, trackError);
          continue;
        }

        // Insert karaoke data if enabled
        if (track.hasKaraoke && track.lyrics && insertedTrack) {
          // For album uploads, we don't have separate instrumental files yet
          // Artists would need to upload instrumentals separately
          // For now, we'll create a placeholder entry
          const { error: karaokeError } = await supabase
            .from('track_karaoke')
            .insert({
              track_id: insertedTrack.id,
              instrumental_url: audioUrl, // Using main audio as placeholder
              lyrics: track.lyrics,
            });

          if (karaokeError) {
            console.error('Failed to save karaoke data:', karaokeError);
          }
        }

        // Insert feature artists
        if (track.featureArtists && track.featureArtists.length > 0 && insertedTrack) {
          for (const artist of track.featureArtists) {
            const { error: featureError } = await supabase
              .from('track_features')
              .insert({
                track_id: insertedTrack.id,
                artist_id: artist.id,
              });

            if (featureError) {
              console.error('Failed to save feature artist:', featureError);
            }
          }
        }

        // Insert track credits
        if (track.credits && insertedTrack) {
          const creditsToInsert = [
            ...track.credits.writers.map(name => ({ track_id: insertedTrack.id, role: 'writer', name })),
            ...track.credits.composers.map(name => ({ track_id: insertedTrack.id, role: 'composer', name })),
            ...track.credits.producers.map(name => ({ track_id: insertedTrack.id, role: 'producer', name })),
            ...track.credits.engineers.map(name => ({ track_id: insertedTrack.id, role: 'engineer', name })),
          ];

          if (creditsToInsert.length > 0) {
            const { error: creditsError } = await supabase
              .from('track_credits')
              .insert(creditsToInsert);

            if (creditsError) {
              console.error('Failed to save track credits:', creditsError);
            }
          }
        }

        completedTracks++;
      }

      return { success: true, albumId: album.id };
    } catch (error) {
      console.error('Album upload error:', error);
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
    uploadAlbum,
  };
};
