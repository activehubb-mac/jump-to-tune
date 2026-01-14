import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Music, CreditCard, Heart } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";

interface Track {
  id: string;
  title: string;
  cover_art_url?: string | null;
  price: number;
  artist?: {
    display_name: string | null;
  };
}

interface TipPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TipPaymentModal({
  open,
  onOpenChange,
  track,
}: TipPaymentModalProps) {
  const { createPaymentCheckout } = useDownload();
  const [tipAmount, setTipAmount] = useState(track.price);
  const [isProcessing, setIsProcessing] = useState(false);

  const minimumAmount = track.price;
  const artistShare = (tipAmount * 0.85).toFixed(2);
  const platformShare = (tipAmount * 0.15).toFixed(2);

  const handleTipChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTipAmount(Math.max(numValue, 0));
  };

  const handlePayment = async () => {
    if (tipAmount < minimumAmount) {
      return;
    }

    setIsProcessing(true);
    try {
      const url = await createPaymentCheckout(
        {
          trackId: track.id,
          trackTitle: track.title,
          trackPrice: track.price,
        },
        tipAmount - track.price // Extra tip amount beyond the track price
      );

      if (url) {
        window.open(url, "_blank");
        onOpenChange(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAmount = tipAmount >= minimumAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Support the Artist
          </DialogTitle>
          <DialogDescription>
            Pay to download this track permanently to your device
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tip-amount">Payment Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="tip-amount"
                type="number"
                min={minimumAmount}
                step="0.01"
                value={tipAmount}
                onChange={(e) => handleTipChange(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: ${minimumAmount.toFixed(2)} (artist's set price)
            </p>
          </div>

          {!isValidAmount && (
            <p className="text-sm text-destructive">
              Amount must be at least ${minimumAmount.toFixed(2)}
            </p>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Artist receives (85%)</span>
              <span className="font-medium">${artistShare}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (15%)</span>
              <span>${platformShare}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handlePayment}
            disabled={isProcessing || !isValidAmount}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Pay ${tipAmount.toFixed(2)} & Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
