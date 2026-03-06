import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Zap, Sparkles, Rocket } from "lucide-react";
import { useAICredits } from "@/hooks/useAICredits";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
  trackTitle?: string;
  onSuccess?: () => void;
  /** @deprecated use requiredCredits instead */
  requiredCents?: number;
}

const CREDIT_PACKS = [
  { productId: "prod_U64QH9DtMPUYNi", credits: 100, price: "$10", label: "100 Credits", icon: Zap },
  { productId: "prod_U64Scf2yEj3f3R", credits: 500, price: "$40", label: "500 Credits", icon: Sparkles, popular: true },
  { productId: "prod_U64VwSdypd7g5x", credits: 2000, price: "$120", label: "2,000 Credits", icon: Rocket },
];

export function InsufficientCreditsModal({
  open,
  onOpenChange,
  requiredCredits = 0,
  requiredCents,
  trackTitle,
  onSuccess,
}: InsufficientCreditsModalProps) {
  const { user } = useAuth();
  const { aiCredits } = useAICredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const needed = requiredCredits || 0;
  const shortfall = Math.max(0, needed - aiCredits);

  const handlePurchase = async (productId: string) => {
    if (!user) return;
    setPurchasing(productId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("purchase-credits", {
        body: { product_id: productId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const { url } = res.data;
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
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
              ? `You need more credits for "${trackTitle}".`
              : "You need more credits to complete this action."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance vs Required */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              <p className="text-2xl font-bold">{aiCredits}</p>
            </div>
            {needed > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 text-center">
                <p className="text-sm text-muted-foreground mb-1">Required</p>
                <p className="text-2xl font-bold text-destructive">{needed}</p>
              </div>
            )}
          </div>

          {shortfall > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <span className="text-sm">You need at least</span>
              <span className="font-semibold text-amber-500">{shortfall} more credits</span>
            </div>
          )}

          {/* Credit Packs */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Buy a credit pack:</p>
            {CREDIT_PACKS.map((pack) => {
              const Icon = pack.icon;
              const coversShortfall = pack.credits >= shortfall;
              return (
                <button
                  key={pack.productId}
                  onClick={() => handlePurchase(pack.productId)}
                  disabled={!!purchasing}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    "border-border hover:border-primary/50 hover:bg-primary/5",
                    coversShortfall && !purchasing && "border-green-500/30 bg-green-500/5",
                    purchasing === pack.productId && "opacity-70"
                  )}
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">{pack.label}</span>
                  {purchasing === pack.productId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="text-sm font-bold text-foreground">{pack.price}</span>
                  )}
                </button>
              );
            })}
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
