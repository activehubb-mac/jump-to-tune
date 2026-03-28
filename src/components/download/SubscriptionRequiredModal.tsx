import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Music, Download, Sparkles } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBSCRIPTION_TIERS = [
  {
    tier: "fan" as const,
    name: "Creator",
    price: "$9.99",
    features: ["Unlimited streaming", "300 AI credits/month", "Download to collection & device"],
  },
  {
    tier: "artist" as const,
    name: "Creator Pro",
    price: "$24.99",
    features: ["All Creator features", "800 AI credits/month", "Upload unlimited tracks & analytics"],
  },
  {
    tier: "label" as const,
    name: "Label / Studio",
    price: "$79.99",
    features: ["All Creator Pro features", "2,000 AI credits/month", "Manage up to 10 artists"],
  },
];

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
}: SubscriptionRequiredModalProps) {
  const { role } = useAuth();
  const { createSubscriptionCheckout } = useDownload();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: "fan" | "artist" | "label") => {
    setLoadingTier(tier);
    try {
      const url = await createSubscriptionCheckout(tier);
      if (url) {
        window.open(url, "_blank");
        onOpenChange(false);
      }
    } finally {
      setLoadingTier(null);
    }
  };

  // Get recommended tier based on user's role
  const recommendedTier = role || "fan";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription Required
          </DialogTitle>
          <DialogDescription>
            Subscribe to unlock downloads and streaming. Start with a 30-day free trial!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">30-Day FREE Trial</span>
          </div>

          <div className="space-y-3">
            {SUBSCRIPTION_TIERS.map((tierInfo) => (
              <div
                key={tierInfo.tier}
                className={`border rounded-lg p-4 ${
                  tierInfo.tier === recommendedTier
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tierInfo.name}</span>
                    {tierInfo.tier === recommendedTier && (
                      <Badge variant="default" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tierInfo.price}/month after trial
                  </span>
                </div>
                <ul className="text-sm text-muted-foreground mb-3 space-y-1">
                  {tierInfo.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Music className="h-3 w-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tierInfo.tier === recommendedTier ? "default" : "outline"}
                  onClick={() => handleSubscribe(tierInfo.tier)}
                  disabled={loadingTier !== null}
                >
                  {loadingTier === tierInfo.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
