import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, Music, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: number;
  filename: string;
  coverUrl?: string | null;
  isComplete: boolean;
}

export function DownloadProgressModal({
  open,
  onOpenChange,
  progress,
  filename,
  coverUrl,
  isComplete,
}: DownloadProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Download Complete
              </>
            ) : (
              <>
                <Download className="h-5 w-5 animate-pulse text-primary" />
                Downloading...
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Track Info */}
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{filename}</p>
              <p className="text-sm text-muted-foreground">
                {isComplete ? "Saved to Documents" : `${Math.round(progress)}%`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={cn(
                "h-2 transition-all",
                isComplete && "bg-green-500/20"
              )}
            />
            {!isComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Please wait while your track downloads...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
