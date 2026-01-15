import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Configurable threshold in cents (default $2)
const DEFAULT_LOW_BALANCE_THRESHOLD_CENTS = 200;
const STORAGE_KEY = "lowBalanceThreshold";
const DISMISSED_KEY = "lowBalanceWarningDismissed";

interface LowBalanceWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  averagePurchase?: number;
}

export function LowBalanceWarningModal({
  open,
  onOpenChange,
  currentBalance,
  averagePurchase,
}: LowBalanceWarningModalProps) {
  const navigate = useNavigate();

  const handleTopUp = () => {
    onOpenChange(false);
    navigate("/wallet");
  };

  const handleDismiss = () => {
    // Store dismissal time to prevent showing again for a while
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    onOpenChange(false);
  };

  const balanceDollars = (currentBalance / 100).toFixed(2);
  const avgPurchaseDollars = averagePurchase 
    ? (averagePurchase / 100).toFixed(2) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-glass-border/30">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              "bg-amber-500/20 backdrop-blur-sm",
              "shadow-[0_0_20px_hsl(38_92%_50%/0.4)]"
            )}
          >
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Low Credit Balance
          </DialogTitle>
          <DialogDescription className="text-muted-foreground space-y-2">
            <p>
              Your balance is now <span className="font-semibold text-foreground">${balanceDollars}</span>.
            </p>
            {avgPurchaseDollars && (
              <p className="text-sm">
                This is below your average purchase of ${avgPurchaseDollars}.
              </p>
            )}
            <p className="text-sm">
              Consider topping up to continue enjoying seamless purchases!
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1 border-glass-border hover:bg-muted/50"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleTopUp}
            className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Top Up Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage low balance warning state
export function useLowBalanceWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [warningData, setWarningData] = useState<{
    currentBalance: number;
    averagePurchase?: number;
  } | null>(null);

  const getThreshold = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_LOW_BALANCE_THRESHOLD_CENTS;
  }, []);

  const setThreshold = useCallback((cents: number) => {
    localStorage.setItem(STORAGE_KEY, cents.toString());
  }, []);

  const shouldShowWarning = useCallback(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      // Don't show again for 1 hour after dismissal
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 3600000) {
        return false;
      }
    }
    return true;
  }, []);

  const checkAndShowWarning = useCallback((
    currentBalance: number,
    averagePurchase?: number
  ) => {
    if (!shouldShowWarning()) return;

    const threshold = Math.max(
      getThreshold(),
      averagePurchase ?? 0
    );

    if (currentBalance < threshold && currentBalance > 0) {
      setWarningData({ currentBalance, averagePurchase });
      setShowWarning(true);
    }
  }, [getThreshold, shouldShowWarning]);

  return {
    showWarning,
    setShowWarning,
    warningData,
    checkAndShowWarning,
    getThreshold,
    setThreshold,
  };
}
