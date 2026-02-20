import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Truck, CheckCircle, Clock, Download, RefreshCcw } from "lucide-react";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3 h-3" />, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", icon: <CheckCircle className="w-3 h-3" />, className: "bg-green-500/20 text-green-400 border-green-500/30" },
  fulfilled: { label: "Fulfilled", icon: <Package className="w-3 h-3" />, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped: { label: "Shipped", icon: <Truck className="w-3 h-3" />, className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  refunded: { label: "Refunded", icon: <RefreshCcw className="w-3 h-3" />, className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export function OrdersTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const { orders, isLoading, updateOrderStatus } = useStoreOrders(user?.id, filter);
  const { showFeedback } = useFeedbackSafe();
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const handleDownloadCSV = () => {
    if (!orders.length) return;
    const headers = ["Order ID", "Product", "Buyer Name", "Buyer Email", "Amount", "Status", "Date", "Tracking"];
    const rows = orders.map((o) => [
      o.id,
      o.product?.title || "",
      o.buyer_name || "",
      o.buyer_email || "",
      `$${(o.amount_cents / 100).toFixed(2)}`,
      o.status,
      new Date(o.created_at).toLocaleDateString(),
      (o as any).tracking_number || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTracking = async (orderId: string) => {
    const tracking = trackingInputs[orderId]?.trim();
    if (!tracking) return;
    const { error } = await supabase
      .from("store_orders")
      .update({ tracking_number: tracking, status: "shipped" } as any)
      .eq("id", orderId);
    if (error) {
      showFeedback({ type: "error", title: "Error", message: "Failed to save tracking number" });
    } else {
      showFeedback({ type: "success", title: "Saved", message: "Tracking number added & order marked shipped", autoClose: true, autoCloseDelay: 2000 });
      setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
    }
  };

  const handleRefund = async (orderId: string) => {
    setRefundingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("refund-store-order", {
        body: { orderId },
      });
      if (error) throw error;
      showFeedback({ type: "success", title: "Refunded", message: "Order has been refunded", autoClose: true, autoCloseDelay: 2000 });
    } catch (err: any) {
      showFeedback({ type: "error", title: "Refund Failed", message: err.message || "Could not process refund" });
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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
        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!orders.length} className="border-glass-border">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

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
            const isMerch = order.product?.type === "merch";
            const canManage = order.status === "pending" || order.status === "completed";
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
                      {(order as any).tracking_number && <p className="text-xs">Tracking: {(order as any).tracking_number}</p>}
                      {address && (
                        <p className="text-xs">
                          Ship to: {address.line1}, {address.city}, {address.state} {address.postal_code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {canManage && isMerch && (
                      <>
                        <div className="flex gap-1">
                          <Input
                            className="w-32 h-8 text-xs"
                            placeholder="Tracking #"
                            value={trackingInputs[order.id] || ""}
                            onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" onClick={() => handleSaveTracking(order.id)} disabled={!trackingInputs[order.id]?.trim()}>
                            <Truck className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: "fulfilled" })}
                          disabled={updateOrderStatus.isPending}
                        >
                          Mark Fulfilled
                        </Button>
                      </>
                    )}
                    {canManage && order.status !== "refunded" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleRefund(order.id)}
                        disabled={refundingId === order.id}
                      >
                        {refundingId === order.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
