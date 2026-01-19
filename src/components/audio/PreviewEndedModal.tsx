import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Disc3, Play, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { InstantPurchaseModal } from "@/components/wallet/InstantPurchaseModal";

interface PreviewEndedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title: string;
    cover_art_url: string | null;
    price: number;
    artist?: {
      id?: string;
      display_name: string | null;
    };
  } | null;
  onReplayPreview: () => void;
  onPurchaseSuccess?: () => void;
}

export function PreviewEndedModal({
  open,
  onOpenChange,
  track,
  onReplayPreview,
  onPurchaseSuccess,
}: PreviewEndedModalProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  if (!track) return null;

  const priceInDollars = (track.price / 100).toFixed(2);

  const handlePurchaseClick = () => {
    onOpenChange(false);
    setShowPurchaseModal(true);
  };

  const handleReplay = () => {
    onOpenChange(false);
    onReplayPreview();
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    onPurchaseSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Preview Ended</DialogTitle>
            <DialogDescription className="text-center">
              Want to hear the full track?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {/* Track Info */}
            <div className="flex items-center gap-4 w-full p-4 rounded-lg bg-muted/30">
              <div className="w-16 h-16 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist?.display_name || "Unknown Artist"}
                </p>
                <p className="text-lg font-bold text-primary mt-1">${priceInDollars}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={handlePurchaseClick}
                className="w-full gradient-accent"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase Full Track
              </Button>
              <Button
                variant="outline"
                onClick={handleReplay}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Replay 30s Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Modal */}
      <InstantPurchaseModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        track={track}
        onPurchaseComplete={handlePurchaseSuccess}
      />
    </>
  );
}
