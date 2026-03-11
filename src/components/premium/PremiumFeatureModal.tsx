import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Shuffle, Repeat, ListMusic, ArrowUpDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const premiumFeatures = [
  { icon: ListMusic, label: "Queue management & Add to Queue" },
  { icon: Shuffle, label: "Shuffle mode" },
  { icon: Repeat, label: "Repeat modes (All, One)" },
  { icon: ArrowUpDown, label: "Collection sorting" },
];

export function PremiumFeatureModal({
  open,
  onOpenChange,
  feature,
}: PremiumFeatureModalProps) {
  const { isInTrial, daysLeftInTrial } = useSubscription();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Premium Feature</DialogTitle>
              <DialogDescription>
                Subscribe to unlock all features
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {feature && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{feature}</span> is a premium feature.
            </p>
          )}

          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-foreground">Subscribers get access to:</p>
            {premiumFeatures.map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">30-Day Free Trial</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Try all premium features free for 30 days. Cancel anytime.
            </p>
          </div>

          {isInTrial && daysLeftInTrial > 0 && (
            <p className="text-xs text-center text-muted-foreground mb-4">
              You have {daysLeftInTrial} days left in your trial
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button className="flex-1 gradient-accent" asChild>
            <Link to="/subscription" onClick={() => onOpenChange(false)}>
              <Crown className="h-4 w-4 mr-2" />
              Subscribe Now
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
