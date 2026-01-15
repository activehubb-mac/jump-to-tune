import { Link } from "react-router-dom";
import { Crown, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { differenceInDays, parseISO } from "date-fns";

export function SubscriptionCountdownChip() {
  const { subscription, isLoading, hasActiveSubscription, isInTrial, daysLeftInTrial } = useSubscription();

  if (isLoading || !subscription) return null;

  // Calculate days remaining
  let daysRemaining = 0;
  let label = "";
  let endDate: Date | null = null;

  if (isInTrial && subscription.trial_ends_at) {
    daysRemaining = daysLeftInTrial;
    label = "Trial";
    endDate = parseISO(subscription.trial_ends_at);
  } else if (hasActiveSubscription && subscription.current_period_end) {
    endDate = parseISO(subscription.current_period_end);
    daysRemaining = Math.max(0, differenceInDays(endDate, new Date()));
    label = "Renews";
  } else {
    // No active subscription or trial
    return null;
  }

  // Determine urgency level
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7 && daysRemaining > 3;

  // Icon based on status
  const Icon = isInTrial ? Crown : Calendar;

  return (
    <Link
      to="/subscription"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
        "glass border border-glass-border hover:border-primary/50",
        isUrgent && "border-destructive/50 bg-destructive/10 text-destructive animate-pulse",
        isWarning && "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
        !isUrgent && !isWarning && "text-primary"
      )}
      title={endDate ? `${isInTrial ? "Trial ends" : "Renews"}: ${endDate.toLocaleDateString()}` : undefined}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}:</span>
      <span className="font-bold">{daysRemaining}d</span>
      {isUrgent && <Clock className="w-3 h-3 ml-0.5" />}
    </Link>
  );
}
