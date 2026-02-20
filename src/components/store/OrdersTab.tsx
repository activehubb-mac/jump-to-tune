import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3 h-3" />, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", icon: <CheckCircle className="w-3 h-3" />, className: "bg-green-500/20 text-green-400 border-green-500/30" },
  fulfilled: { label: "Fulfilled", icon: <Package className="w-3 h-3" />, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped: { label: "Shipped", icon: <Truck className="w-3 h-3" />, className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  refunded: { label: "Refunded", icon: <Clock className="w-3 h-3" />, className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export function OrdersTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const { orders, isLoading, updateOrderStatus } = useStoreOrders(user?.id, filter);

  return (
    <div className="space-y-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All orders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="fulfilled">Fulfilled</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const address = order.shipping_address as Record<string, string> | null;
            return (
              <div key={order.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {order.product?.title || "Product"}
                      </h4>
                      <Badge className={config.className}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>${(order.amount_cents / 100).toFixed(2)} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                      {order.buyer_name && <p>Buyer: {order.buyer_name}</p>}
                      {order.edition_number && <p>Edition #{order.edition_number}</p>}
                      {address && (
                        <p className="text-xs">
                          Ship to: {address.line1}, {address.city}, {address.state} {address.postal_code}
                        </p>
                      )}
                    </div>
                  </div>
                  {(order.status === "pending" || order.status === "completed") && order.product?.type === "merch" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: "fulfilled" })}
                        disabled={updateOrderStatus.isPending}
                      >
                        Fulfilled
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: "shipped" })}
                        disabled={updateOrderStatus.isPending}
                      >
                        Shipped
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
