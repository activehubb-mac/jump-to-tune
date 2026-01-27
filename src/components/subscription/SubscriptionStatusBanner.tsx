import { Link } from "react-router-dom";
import { Crown, Sparkles, Calendar, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface SubscriptionStatusBannerProps {
  className?: string;
}

export function SubscriptionStatusBanner({ className }: SubscriptionStatusBannerProps) {
  const { 
    subscription, 
    isLoading, 
    hasActiveSubscription, 
    isInTrial, 
    daysLeftInTrial 
  } = useSubscription();

  if (isLoading) {
    return (
      <div className={cn("glass-card p-4", className)}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading subscription...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cn("glass-card p-4 bg-muted/30", className)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No Active Subscription</p>
              <p className="text-sm text-muted-foreground">Start your 3-month free trial today!</p>
            </div>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm" asChild>
            <Link to="/subscription">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate days remaining
  let daysRemaining = 0;
  let endDate: Date | null = null;

  if (isInTrial && subscription.trial_ends_at) {
    daysRemaining = daysLeftInTrial;
    endDate = parseISO(subscription.trial_ends_at);
  } else if (hasActiveSubscription && subscription.current_period_end) {
    endDate = parseISO(subscription.current_period_end);
    daysRemaining = Math.max(0, differenceInDays(endDate, new Date()));
  }

  // Determine urgency level
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7 && daysRemaining > 3;
  const showRenewalWarning = daysRemaining <= 7;

  // Format tier name
  const tierName = subscription.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : "Unknown";

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all",
        isUrgent && "border-destructive/50 bg-destructive/5",
        isWarning && "border-yellow-500/30 bg-yellow-500/5",
        !isUrgent && !isWarning && "bg-muted/30",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isInTrial ? "bg-primary/20" : "bg-accent/20"
            )}
          >
            {isInTrial ? (
              <Sparkles className="w-5 h-5 text-primary" />
            ) : (
              <Crown className="w-5 h-5 text-accent" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{tierName} Plan</p>
              {isInTrial && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                  Trial
                </Badge>
              )}
              {subscription.status === "active" && !isInTrial && (
                <Badge variant="default" className="text-xs">Active</Badge>
              )}
              {subscription.status === "canceled" && (
                <Badge variant="destructive" className="text-xs">Canceled</Badge>
              )}
              {subscription.status === "past_due" && (
                <Badge variant="destructive" className="text-xs">Past Due</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isInTrial ? "Trial ends" : "Renews"}{" "}
                {endDate ? format(endDate, "MMM d, yyyy") : "N/A"}
                {showRenewalWarning && (
                  <span
                    className={cn(
                      "ml-2 font-medium",
                      isUrgent ? "text-destructive" : "text-yellow-500"
                    )}
                  >
                    ({daysRemaining} days left)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showRenewalWarning && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                isUrgent
                  ? "bg-destructive/20 text-destructive"
                  : "bg-yellow-500/20 text-yellow-600"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isUrgent ? "Expiring soon!" : "Renew soon"}
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/subscription">
              {hasActiveSubscription ? "Manage" : "Upgrade"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
