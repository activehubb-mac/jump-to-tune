import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "purchase" | "spend" | "refund";
  amount_cents: number;
  fee_cents: number;
  description: string;
  created_at: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" style={{ contain: 'layout' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 animate-pulse min-h-[64px]">
            <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
            <div className="text-right shrink-0">
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions yet</p>
        <p className="text-sm mt-1">Your credit history will appear here</p>
      </div>
    );
  }

  const getIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case "spend":
        return <ArrowUpRight className="h-5 w-5 text-primary" />;
      case "refund":
        return <RotateCcw className="h-5 w-5 text-blue-500" />;
    }
  };

  const getIconBg = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return "bg-green-500/20";
      case "spend":
        return "bg-primary/20";
      case "refund":
        return "bg-blue-500/20";
    }
  };

  return (
    <div className="space-y-2" style={{ contain: 'layout' }}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-h-[64px]"
        >
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getIconBg(tx.type))}>
            {getIcon(tx.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{tx.description}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")}
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              "font-semibold",
              tx.amount_cents > 0 ? "text-green-500" : "text-foreground"
            )}>
              {tx.amount_cents > 0 ? "+" : ""}${(tx.amount_cents / 100).toFixed(2)}
            </p>
            {tx.fee_cents > 0 && (
              <p className="text-xs text-muted-foreground">
                Fee: ${(tx.fee_cents / 100).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
