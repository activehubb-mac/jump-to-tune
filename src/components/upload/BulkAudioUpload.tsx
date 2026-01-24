import { useState, useRef, useCallback } from 'react';
import { Music, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidAudioFile, formatFileSize, getAudioDuration, formatDuration } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

export interface AudioTrackFile {
  id: string;
  file: File;
  duration: number;
  title: string;
  trackNumber: number;
}

interface BulkAudioUploadProps {
  tracks: AudioTrackFile[];
  onChange: (tracks: AudioTrackFile[]) => void;
  minTracks?: number;
  maxTracks?: number;
  disabled?: boolean;
  hideTrackList?: boolean;
}

export const BulkAudioUpload = ({ 
  tracks, 
  onChange, 
  minTracks = 1, 
  maxTracks = 20,
  disabled,
  hideTrackList = false
}: BulkAudioUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const extractTitleFromFilename = (filename: string): string => {
    // Remove extension and clean up
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Filter valid audio files
    const validFiles = fileArray.filter(isValidAudioFile);
    
    if (validFiles.length === 0) {
      setError('No valid audio files found. Please upload MP3, WAV, or FLAC files.');
      return;
    }

    if (tracks.length + validFiles.length > maxTracks) {
      setError(`Maximum ${maxTracks} tracks allowed.`);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const newTracks: AudioTrackFile[] = [];
      
      for (const file of validFiles) {
        if (file.size > 50 * 1024 * 1024) {
          console.warn(`Skipping ${file.name}: file too large`);
          continue;
        }

        try {
          const duration = await getAudioDuration(file);
          newTracks.push({
            id: generateId(),
            file,
            duration,
            title: extractTitleFromFilename(file.name),
            trackNumber: tracks.length + newTracks.length + 1,
          });
        } catch {
          console.warn(`Could not process ${file.name}`);
        }
      }

      if (newTracks.length > 0) {
        onChange([...tracks, ...newTracks]);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [tracks, onChange, maxTracks]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeTrack = (id: string) => {
    const updated = tracks
      .filter(t => t.id !== id)
      .map((t, index) => ({ ...t, trackNumber: index + 1 }));
    onChange(updated);
  };

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="space-y-4">
      {/* Track List */}
      {!hideTrackList && tracks.length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''} • {formatDuration(totalDuration)}
            </p>
            {tracks.length < minTracks && (
              <p className="text-sm text-warning flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Need at least {minTracks} track{minTracks !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {tracks.map((track) => (
            <div 
              key={track.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-glass-border"
            >
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">{track.trackNumber}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{track.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(track.duration)} • {formatFileSize(track.file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTrack(track.id)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-glass-border hover:border-primary/50",
          error && "border-destructive/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/flac"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
          multiple
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-foreground font-medium">Processing audio files...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {tracks.length > 0 ? 'Add more tracks' : 'Drop your audio files here'}
            </p>
            <p className="text-sm text-muted-foreground">
              MP3, WAV, FLAC up to 50MB each • Select multiple files
            </p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4 border-glass-border"
              disabled={disabled}
            >
              Choose Files
            </Button>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
