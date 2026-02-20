import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  product?: { title: string; type: string } | null;
}

interface VaultOrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  shipped: "bg-blue-500/20 text-blue-400",
  fulfilled: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
};

export function VaultOrderHistory({ orders, isLoading }: VaultOrderHistoryProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Order History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Order History</h2>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-glass-border">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{order.product?.title || "Product"}</p>
                <p className="text-xs text-muted-foreground">
                  ${(order.amount_cents / 100).toFixed(2)} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge className={`shrink-0 ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                {order.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
