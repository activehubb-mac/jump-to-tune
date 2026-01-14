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
  const { balanceDollars, isLoading } = useWallet();

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
        className
      )}
    >
      {showIcon && <Wallet className="h-4 w-4 text-primary" />}
      {isLoading ? (
        <span className="animate-pulse">...</span>
      ) : (
        <span className="font-semibold">${balanceDollars.toFixed(2)}</span>
      )}
    </Button>
  );
}
