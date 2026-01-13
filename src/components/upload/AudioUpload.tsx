import { useState, useRef, useCallback } from 'react';
import { Music, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getAudioDuration, formatDuration, isValidAudioFile, formatFileSize } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  value: File | null;
  onChange: (file: File | null, duration?: number) => void;
  uploadProgress?: number;
  disabled?: boolean;
}

export const AudioUpload = ({ value, onChange, uploadProgress, disabled }: AudioUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    
    if (!isValidAudioFile(file)) {
      setError('Invalid file type. Please upload MP3, WAV, or FLAC.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const audioDuration = await getAudioDuration(file);
      setDuration(audioDuration);
      onChange(file, audioDuration);
    } catch {
      setError('Could not read audio file. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setDuration(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (value && duration !== null) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{value.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDuration(duration)} • {formatFileSize(value.size)}
            </p>
            {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="mt-2 h-1" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-foreground font-medium">Processing audio...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">Drop your audio file here</p>
            <p className="text-sm text-muted-foreground">MP3, WAV, FLAC up to 50MB</p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4 border-glass-border"
              disabled={disabled}
            >
              Choose File
            </Button>
          </>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
