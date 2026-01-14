import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Wallet, CreditCard } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCents: number;
  trackTitle?: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [
  { cents: 500, label: "+$5" },
  { cents: 1000, label: "+$10" },
  { cents: 2500, label: "+$25" },
];

export function InsufficientCreditsModal({
  open,
  onOpenChange,
  requiredCents,
  trackTitle,
  onSuccess,
}: InsufficientCreditsModalProps) {
  const { balanceDollars, balance, purchaseCredits, isPurchasing } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const shortfallCents = Math.max(0, requiredCents - balance);
  const recommendedAmount = Math.ceil(shortfallCents / 500) * 500; // Round up to nearest $5

  // Auto-select the minimum needed amount
  const getRecommendedPreset = () => {
    return QUICK_AMOUNTS.find(a => a.cents >= shortfallCents)?.cents || 2500;
  };

  const handlePurchase = async () => {
    const amount = selectedAmount || getRecommendedPreset();
    await purchaseCredits(amount);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-5 w-5" />
            Insufficient Credits
          </DialogTitle>
          <DialogDescription>
            {trackTitle 
              ? `You need more credits to purchase "${trackTitle}".`
              : "You need more credits to complete this purchase."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              <p className="text-2xl font-bold">${balanceDollars.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 text-center">
              <p className="text-sm text-muted-foreground mb-1">Required</p>
              <p className="text-2xl font-bold text-destructive">
                ${(requiredCents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Shortfall */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <span className="text-sm">You need at least</span>
            <span className="font-semibold text-amber-500">
              ${(shortfallCents / 100).toFixed(2)} more
            </span>
          </div>

          {/* Quick Add Amounts */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick add credits:</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => {
                const isRecommended = amount.cents === getRecommendedPreset();
                return (
                  <Button
                    key={amount.cents}
                    variant="outline"
                    onClick={() => setSelectedAmount(amount.cents)}
                    className={cn(
                      "relative border-glass-border",
                      selectedAmount === amount.cents && "border-primary bg-primary/20",
                      isRecommended && !selectedAmount && "border-green-500 bg-green-500/10"
                    )}
                  >
                    {amount.label}
                    {isRecommended && !selectedAmount && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                        Best
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-accent neon-glow-subtle"
              onClick={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Credits
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
