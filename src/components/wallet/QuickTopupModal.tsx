import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Sparkles, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickTopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_PACKS = [
  {
    productId: "prod_U64QH9DtMPUYNi",
    credits: 100,
    price: "$10",
    label: "100 Credits",
    icon: Zap,
    description: "Great for occasional use",
  },
  {
    productId: "prod_U64Scf2yEj3f3R",
    credits: 500,
    price: "$40",
    label: "500 Credits",
    icon: Sparkles,
    description: "Best value for creators",
    popular: true,
  },
  {
    productId: "prod_U64VwSdypd7g5x",
    credits: 2000,
    price: "$98",
    label: "2,000 Credits",
    icon: Rocket,
    description: "For power users & teams",
  },
];

export function QuickTopupModal({ open, onOpenChange }: QuickTopupModalProps) {
  const { user } = useAuth();
  const { aiCredits, isLoading: isLoadingBalance } = useAICredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);

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
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Buy AI Credits
          </DialogTitle>
          <DialogDescription>
            Credits power all AI tools — cover art, videos, identity builder & more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="font-semibold text-lg">
              {isLoadingBalance ? "..." : `${aiCredits} credits`}
            </span>
          </div>

          {/* Credit Packs */}
          <div className="space-y-3">
            {CREDIT_PACKS.map((pack) => {
              const Icon = pack.icon;
              return (
                <button
                  key={pack.productId}
                  onClick={() => handlePurchase(pack.productId)}
                  disabled={!!purchasing}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    "border-border hover:border-primary/50 hover:bg-primary/5",
                    pack.popular && "border-primary/30 bg-primary/5",
                    purchasing === pack.productId && "opacity-70"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    "bg-primary/10"
                  )}>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{pack.label}</span>
                      {pack.popular && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                  </div>
                  <div className="shrink-0">
                    {purchasing === pack.productId ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="font-bold text-foreground">{pack.price}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
