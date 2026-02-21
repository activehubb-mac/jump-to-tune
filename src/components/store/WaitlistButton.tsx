import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useWaitlist } from "@/hooks/useWaitlist";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface Props {
  productId: string;
  compact?: boolean;
}

export function WaitlistButton({ productId, compact }: Props) {
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { waitlistCount, isOnWaitlist, joinWaitlist, leaveWaitlist } = useWaitlist(productId);
  const isPending = joinWaitlist.isPending || leaveWaitlist.isPending;

  const handleClick = () => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign in required", message: "Please sign in to join the waitlist" });
      return;
    }
    if (isOnWaitlist) {
      leaveWaitlist.mutate();
    } else {
      joinWaitlist.mutate(undefined, {
        onSuccess: () => showFeedback({ type: "success", title: "Joined Waitlist", message: "You'll be notified when this drop is restocked." }),
      });
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size={compact ? "sm" : "default"}
        variant={isOnWaitlist ? "outline" : "default"}
        className={isOnWaitlist ? "border-primary text-primary" : "gradient-accent"}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : isOnWaitlist ? (
          <BellOff className="w-3 h-3 mr-1" />
        ) : (
          <Bell className="w-3 h-3 mr-1" />
        )}
        {isOnWaitlist ? "On Waitlist" : "Join Waitlist"}
      </Button>
      {waitlistCount > 0 && (
        <span className="text-[10px] text-muted-foreground">{waitlistCount} waiting</span>
      )}
    </div>
  );
}
