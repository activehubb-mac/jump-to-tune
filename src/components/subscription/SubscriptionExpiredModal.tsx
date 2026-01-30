import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Clock, Sparkles, Music, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionExpiredModal({
  open,
  onOpenChange,
}: SubscriptionExpiredModalProps) {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  const isTrialExpired = subscription?.status === "none" || subscription?.status === "canceled";

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  const handleBrowse = () => {
    onOpenChange(false);
    navigate("/browse");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            {isTrialExpired ? "Your Trial Has Ended" : "Subscription Required"}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {isTrialExpired
              ? "Your free trial has expired. Subscribe now to continue enjoying premium features."
              : "This feature requires an active subscription. Subscribe to unlock all premium features."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Music className="w-5 h-5 text-primary" />
            <span className="text-sm">Unlimited queue management</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm">Shuffle & repeat modes</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm">Collection sorting & organization</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            className="w-full gradient-accent neon-glow"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            View Subscription Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button
            onClick={handleBrowse}
            variant="outline"
            className="w-full border-glass-border"
          >
            Continue Browsing (Limited)
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can still stream music and purchase tracks without a subscription.
        </p>
      </DialogContent>
    </Dialog>
  );
}
