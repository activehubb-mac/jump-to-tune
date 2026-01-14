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
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Wallet, Info } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

interface QuickTopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [
  { cents: 500, label: "$5" },
  { cents: 1000, label: "$10" },
  { cents: 2500, label: "$25" },
  { cents: 5000, label: "$50" },
  { cents: 10000, label: "$100" },
];

export function QuickTopupModal({ open, onOpenChange }: QuickTopupModalProps) {
  const { balanceDollars, purchaseCredits, isPurchasing } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (cents: number) => {
    setSelectedAmount(cents);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const getAmountCents = (): number => {
    if (isCustom && customAmount) {
      return Math.round(parseFloat(customAmount) * 100);
    }
    return selectedAmount || 0;
  };

  const getFeeAndCredits = () => {
    const amountCents = getAmountCents();
    const feeCents = Math.ceil(amountCents * 0.01);
    const creditsCents = amountCents - feeCents;
    return { amountCents, feeCents, creditsCents };
  };

  const handlePurchase = async () => {
    const { amountCents } = getFeeAndCredits();
    if (amountCents < 500) return;

    await purchaseCredits(amountCents);
    onOpenChange(false);
  };

  const { amountCents, feeCents, creditsCents } = getFeeAndCredits();
  const isValid = amountCents >= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Add Credits
          </DialogTitle>
          <DialogDescription>
            Credits are used for instant purchases. Minimum purchase is $5.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="font-semibold text-lg">${balanceDollars.toFixed(2)}</span>
          </div>

          {/* Preset Amounts */}
          <div className="space-y-2">
            <Label>Select Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount.cents}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(amount.cents)}
                  className={cn(
                    "border-glass-border",
                    selectedAmount === amount.cents && !isCustom &&
                      "border-primary bg-primary/20 text-primary"
                  )}
                >
                  {amount.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Or enter custom amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="custom-amount"
                type="number"
                min="5"
                step="0.01"
                placeholder="5.00"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                className={cn(
                  "pl-7",
                  isCustom && "border-primary"
                )}
              />
            </div>
          </div>

          {/* Fee Breakdown */}
          {isValid && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>A 1% processing fee is applied when purchasing credits.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You pay</span>
                <span>${(amountCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing fee (1%)</span>
                <span>-${(feeCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-primary border-t border-border pt-2">
                <span>Credits added</span>
                <span>${(creditsCents / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <Button
            className="w-full gradient-accent neon-glow-subtle"
            onClick={handlePurchase}
            disabled={!isValid || isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Add ${isValid ? (creditsCents / 100).toFixed(2) : "0.00"} Credits
              </>
            )}
          </Button>

          {!isValid && amountCents > 0 && (
            <p className="text-sm text-destructive text-center">
              Minimum purchase is $5.00
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
