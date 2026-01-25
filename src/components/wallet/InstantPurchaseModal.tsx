import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Download, Music } from "lucide-react";
import { useInstantPurchase, isInsufficientCreditsError } from "@/hooks/useInstantPurchase";
import { useWallet } from "@/hooks/useWallet";
import { useDownload } from "@/hooks/useDownload";
import { InsufficientCreditsModal } from "./InsufficientCreditsModal";
import { DownloadProgressModal } from "@/components/download/DownloadProgressModal";

interface Track {
  id: string;
  title: string;
  price: number;
  cover_art_url?: string | null;
  artist?: {
    display_name: string | null;
  };
}

interface InstantPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  onPurchaseComplete?: () => void;
}

export function InstantPurchaseModal({
  open,
  onOpenChange,
  track,
  onPurchaseComplete,
}: InstantPurchaseModalProps) {
  const { balanceDollars, refetch: refetchWallet } = useWallet();
  const { purchaseTrack, isPurchasing, lastPurchase } = useInstantPurchase();
  const { 
    downloadOwnedTrack, 
    isDownloading, 
    downloadProgress, 
    downloadFilename, 
    showProgressModal, 
    setShowProgressModal, 
    downloadComplete,
    downloadCoverUrl,
  } = useDownload();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientData, setInsufficientData] = useState<{ required: number } | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [editionNumber, setEditionNumber] = useState<number | null>(null);

  const priceCents = Math.round(track.price * 100);
  const hasEnoughCredits = balanceDollars >= track.price;

  const handlePurchase = async () => {
    const result = await purchaseTrack(track.id);

    if (isInsufficientCreditsError(result)) {
      setInsufficientData({ required: result.required_cents });
      setShowInsufficientModal(true);
      return;
    }

    if (result?.success) {
      setPurchaseSuccess(true);
      setEditionNumber(result.edition_number);
      refetchWallet();
      onPurchaseComplete?.();
    }
  };

  const handleDownload = async () => {
    await downloadOwnedTrack(track.id, track.cover_art_url);
    if (!showProgressModal) {
      // Only close immediately on web (no progress modal)
      onOpenChange(false);
      setPurchaseSuccess(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setPurchaseSuccess(false);
      setEditionNumber(null);
    }, 300);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {purchaseSuccess ? "Purchase Complete!" : "Confirm Purchase"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Track Info */}
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-semibold text-lg truncate">{track.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  by {track.artist?.display_name || "Unknown Artist"}
                </p>
                {editionNumber && (
                  <span className="text-xs text-primary mt-1">
                    Edition #{editionNumber}
                  </span>
                )}
              </div>
            </div>

            {purchaseSuccess ? (
              /* Success State */
              <div className="space-y-4">
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    This track is now in your library. You can download it anytime.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Done
                  </Button>
                  <Button
                    className="flex-1 gradient-accent neon-glow-subtle"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Purchase State */
              <div className="space-y-4">
                {/* Price and Balance */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Track Price</span>
                    <span className="font-semibold">${track.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className={hasEnoughCredits ? "text-green-500" : "text-amber-500"}>
                      ${balanceDollars.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-muted-foreground">After Purchase</span>
                    <span className="font-semibold">
                      ${Math.max(0, balanceDollars - track.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Revenue Split Info */}
                <p className="text-xs text-muted-foreground text-center">
                  85% goes to the artist • 15% platform fee
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gradient-accent neon-glow-subtle"
                    onClick={handlePurchase}
                    disabled={isPurchasing || !hasEnoughCredits}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Purchasing...
                      </>
                    ) : hasEnoughCredits ? (
                      "Buy Now"
                    ) : (
                      "Add Credits First"
                    )}
                  </Button>
                </div>

                {!hasEnoughCredits && (
                  <Button
                    variant="link"
                    className="w-full text-primary"
                    onClick={() => setShowInsufficientModal(true)}
                  >
                    Add credits to your wallet →
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientCreditsModal
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
        requiredCents={insufficientData?.required || priceCents}
        trackTitle={track.title}
        onSuccess={() => refetchWallet()}
      />

      <DownloadProgressModal
        open={showProgressModal}
        onOpenChange={setShowProgressModal}
        progress={downloadProgress}
        filename={downloadFilename}
        coverUrl={downloadCoverUrl || track.cover_art_url}
        isComplete={downloadComplete}
      />
    </>
  );
}
