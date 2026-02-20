import { Loader2, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export function StoreAnalyticsTab() {
  const { user } = useAuth();
  const { orders, isLoading } = useStoreOrders(user?.id);

  const { data: superfanCount } = useQuery({
    queryKey: ["superfan-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("superfan_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount_cents, 0);
  const totalFees = orders.reduce((sum, o) => sum + o.platform_fee_cents, 0);
  const totalOrders = orders.length;

  // Find top product
  const productCounts: Record<string, { title: string; count: number }> = {};
  orders.forEach((o) => {
    const title = o.product?.title || "Unknown";
    if (!productCounts[o.product_id]) productCounts[o.product_id] = { title, count: 0 };
    productCounts[o.product_id].count++;
  });
  const topProduct = Object.values(productCounts).sort((a, b) => b.count - a.count)[0];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs text-muted-foreground">Revenue</span>
          </div>
          <p className="text-xl font-bold text-foreground">${(totalRevenue / 100).toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Fees Paid</span>
          </div>
          <p className="text-xl font-bold text-foreground">${(totalFees / 100).toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Orders</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalOrders}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-muted-foreground">Superfans</span>
          </div>
          <p className="text-xl font-bold text-foreground">{superfanCount ?? 0}</p>
        </div>
      </div>

      {/* Top Product */}
      {topProduct && (
        <div className="glass-card p-4">
          <h4 className="text-sm text-muted-foreground mb-1">Top Product</h4>
          <p className="font-semibold text-foreground">{topProduct.title}</p>
          <p className="text-sm text-primary">{topProduct.count} orders</p>
        </div>
      )}

      {/* Recent Orders */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Recent Orders</h4>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate">{order.product?.title || "Product"}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-primary">${(order.amount_cents / 100).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
