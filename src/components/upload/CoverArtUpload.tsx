import { useState, useRef, useCallback } from 'react';
import { Image, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { isValidImageFile, formatFileSize } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';

interface CoverArtUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  uploadProgress?: number;
  disabled?: boolean;
  onGenerateAI?: () => void;
}

export const CoverArtUpload = ({ value, onChange, uploadProgress, disabled }: CoverArtUploadProps) => {
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

    // Create preview
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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={preview} 
              alt="Cover preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{value.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(value.size)}</p>
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
        
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <Image className="w-8 h-8 text-accent" />
        </div>
        <p className="text-foreground font-medium mb-1">Drop your cover art here</p>
        <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB (1:1 ratio recommended)</p>
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
