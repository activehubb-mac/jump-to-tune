import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bookmark, Download, Music } from "lucide-react";

interface Track {
  id: string;
  title: string;
  cover_art_url?: string | null;
  price: number;
  artist?: {
    display_name: string | null;
  };
}

interface DownloadOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  onAddToCollection: () => void;
  onDownloadToDevice: () => void;
  isAddingToCollection?: boolean;
}

export function DownloadOptionsModal({
  open,
  onOpenChange,
  track,
  onAddToCollection,
  onDownloadToDevice,
  isAddingToCollection,
}: DownloadOptionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Choose how you'd like to save this track
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          {track.cover_art_url ? (
            <img
              src={track.cover_art_url}
              alt={track.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h4 className="font-semibold">{track.title}</h4>
            {track.artist?.display_name && (
              <p className="text-sm text-muted-foreground">
                {track.artist.display_name}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => {
              onAddToCollection();
              onOpenChange(false);
            }}
            disabled={isAddingToCollection}
          >
            <Bookmark className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Add to Collection</div>
              <div className="text-sm text-muted-foreground">
                Save for quick streaming access (free)
              </div>
            </div>
          </Button>

          <Button
            className="w-full justify-start h-auto p-4"
            onClick={() => {
              onDownloadToDevice();
              onOpenChange(false);
            }}
          >
            <Download className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Download to Device</div>
              <div className="text-sm text-muted-foreground">
                Own permanently (${track.price.toFixed(2)} min. tip)
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
