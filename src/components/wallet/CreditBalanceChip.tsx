import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";

interface CreditBalanceChipProps {
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function CreditBalanceChip({ 
  onClick, 
  className,
  showIcon = true,
}: CreditBalanceChipProps) {
  const { user } = useAuth();
  const { balanceDollars, isLoading, isAnimating } = useWallet();

  if (!user) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "border-primary/30 bg-primary/10 hover:bg-primary/20 text-foreground gap-2",
        "transition-all duration-200",
        balanceDollars < 2 && "border-amber-500/50 bg-amber-500/10",
        isAnimating && "animate-pulse ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        className
      )}
    >
      {showIcon && (
        <Wallet className={cn(
          "h-4 w-4 text-primary transition-transform",
          isAnimating && "animate-bounce"
        )} />
      )}
      {isLoading ? (
        <span className="animate-pulse">...</span>
      ) : (
        <span className={cn(
          "font-semibold transition-all",
          isAnimating && "text-primary"
        )}>
          ${balanceDollars.toFixed(2)}
        </span>
      )}
    </Button>
  );
}
