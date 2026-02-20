import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Gem, Shield, Loader2 } from "lucide-react";
import { SuperfanSubscription } from "@/hooks/useSuperfanStatus";
import { format } from "date-fns";

interface StatusPanelProps {
  isSubscribed: boolean;
  subscription: SuperfanSubscription | null;
  membershipDescription: string | null;
  perks: string[];
  priceCents: number;
  onSubscribe: () => void;
  isCheckingOut: boolean;
  isLoggedIn: boolean;
}

const TIER_CONFIG = {
  bronze: { label: "Bronze", icon: Shield, color: "text-amber-600" },
  gold: { label: "Gold", icon: Crown, color: "text-yellow-400" },
  elite: { label: "Elite", icon: Gem, color: "text-primary" },
};

export function StatusPanel({
  isSubscribed,
  subscription,
  membershipDescription,
  perks,
  priceCents,
  onSubscribe,
  isCheckingOut,
  isLoggedIn,
}: StatusPanelProps) {
  if (isSubscribed && subscription) {
    const tier = TIER_CONFIG[subscription.tier_level as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
    const TierIcon = tier.icon;

    return (
      <div className="glass-card-bordered p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Superfan</h3>
              <Badge variant="secondary" className="gap-1">
                <TierIcon className={`w-3 h-3 ${tier.color}`} />
                {tier.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Member since {format(new Date(subscription.subscribed_at), "MMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Lifetime support</span>
            <p className="text-foreground font-semibold">
              ${(subscription.lifetime_spent_cents / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic">
          Thank you for supporting this artist. Your support makes a real difference.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-bordered p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Star className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Superfan Room</h3>
          <p className="text-sm text-muted-foreground">
            {membershipDescription || "Unlock exclusive content and early access."}
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        {perks.map((perk, i) => (
          <li key={i} className="flex items-center gap-2">
            <Star className="w-3 h-3 text-primary flex-shrink-0" />
            {perk}
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        onClick={onSubscribe}
        disabled={isCheckingOut || !isLoggedIn}
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparing checkout...
          </>
        ) : (
          <>
            <Star className="w-4 h-4 mr-2" />
            Subscribe — ${(priceCents / 100).toFixed(2)}/mo
          </>
        )}
      </Button>

      {!isLoggedIn && (
        <p className="text-xs text-muted-foreground text-center">Sign in to subscribe</p>
      )}
    </div>
  );
}
