import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, CreditCard } from "lucide-react";
import { useMessageCredits } from "@/hooks/useMessageCredits";

interface MessageCreditsPanelProps {
  messageCost?: number;
}

export function MessageCreditsPanel({ messageCost = 1 }: MessageCreditsPanelProps) {
  const { balance, isLoading, purchaseCredits } = useMessageCredits();

  return (
    <div className="glass-card-bordered p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">Message Credits</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {isLoading ? "..." : balance} credits
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Each message costs {messageCost} credit{messageCost > 1 ? "s" : ""}. Credits never expire.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="w-full border-primary/50 text-primary"
        onClick={purchaseCredits}
      >
        <CreditCard className="w-3 h-3 mr-1" />
        Buy 5 Credits — $5
      </Button>
    </div>
  );
}
