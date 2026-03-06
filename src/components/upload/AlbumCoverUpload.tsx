import { useState, useRef, useCallback } from 'react';
import { Image, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { isValidImageFile, formatFileSize } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface AlbumCoverUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  uploadProgress?: number;
  disabled?: boolean;
  onGenerateAI?: () => void;
}

export const AlbumCoverUpload = ({ value, onChange, uploadProgress, disabled }: AlbumCoverUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    if (!isValidImageFile(file)) {
      setError('Invalid file type. Please upload PNG, JPG, or WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    onChange(file);
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
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (value && preview) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border border-glass-border">
            <img 
              src={preview} 
              alt="Album cover preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 pt-2">
            <p className="font-medium text-foreground truncate">{value.name}</p>
            <p className="text-sm text-muted-foreground mb-2">{formatFileSize(value.size)}</p>
            <p className="text-xs text-muted-foreground">
              This cover will be used for all tracks in this release.
            </p>
            {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="mt-3 h-1" />
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
          isDragging ? "border-accent bg-accent/5" : "border-glass-border hover:border-accent/50",
          error && "border-destructive/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="w-20 h-20 mx-auto rounded-xl bg-accent/20 flex items-center justify-center mb-4">
          <Image className="w-10 h-10 text-accent" />
        </div>
        <p className="text-foreground font-medium mb-1">Album Cover Art</p>
        <p className="text-sm text-muted-foreground">
          PNG, JPG up to 10MB • 3000x3000px recommended
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This single cover will be used for all tracks
        </p>
        <Button 
          type="button" 
          variant="outline" 
          className="mt-4 border-glass-border"
          disabled={disabled}
        >
          Choose Image
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
