import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Store, Package, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface StoreWithDetails {
  id: string;
  artist_id: string;
  store_status: string;
  created_at: string;
  artist_name: string | null;
  artist_avatar: string | null;
  product_count: number;
  total_revenue: number;
}

export default function AdminStores() {
  const queryClient = useQueryClient();

  const { data: stores, isLoading } = useQuery({
    queryKey: ["adminStores"],
    queryFn: async (): Promise<StoreWithDetails[]> => {
      const { data: storeData, error } = await supabase
        .from("artist_stores")
        .select("id, artist_id, store_status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!storeData || storeData.length === 0) return [];

      const artistIds = storeData.map((s) => s.artist_id);

      const [profilesRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("profiles_public").select("id, display_name, avatar_url").in("id", artistIds),
        supabase.from("store_products").select("artist_id").in("artist_id", artistIds),
        supabase.from("store_orders").select("artist_id, amount_cents").in("artist_id", artistIds).eq("status", "completed"),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p]) || []);
      
      const productCounts: Record<string, number> = {};
      productsRes.data?.forEach((p) => {
        productCounts[p.artist_id] = (productCounts[p.artist_id] || 0) + 1;
      });

      const revenueTotals: Record<string, number> = {};
      ordersRes.data?.forEach((o) => {
        revenueTotals[o.artist_id] = (revenueTotals[o.artist_id] || 0) + o.amount_cents;
      });

      return storeData.map((store) => {
        const profile = profileMap.get(store.artist_id);
        return {
          ...store,
          artist_name: profile?.display_name || null,
          artist_avatar: profile?.avatar_url || null,
          product_count: productCounts[store.artist_id] || 0,
          total_revenue: revenueTotals[store.artist_id] || 0,
        };
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ storeId, newStatus }: { storeId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("artist_stores")
        .update({ store_status: newStatus })
        .eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminStores"] });
      toast.success("Store status updated");
    },
    onError: () => toast.error("Failed to update store"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No Stores Yet</h3>
        <p className="text-muted-foreground">Artist stores will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Artist Stores</h2>
        <p className="text-sm text-muted-foreground">{stores.length} store{stores.length !== 1 ? "s" : ""} total</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={store.artist_avatar || undefined} />
                  <AvatarFallback>{(store.artist_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{store.artist_name || "Unknown"}</p>
                  <Badge variant={store.store_status === "active" ? "default" : "secondary"} className="text-xs">
                    {store.store_status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>{store.product_count} products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>${(store.total_revenue / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={store.store_status === "active" ? "destructive" : "default"}
                  className="flex-1"
                  onClick={() =>
                    toggleMutation.mutate({
                      storeId: store.id,
                      newStatus: store.store_status === "active" ? "inactive" : "active",
                    })
                  }
                  disabled={toggleMutation.isPending}
                >
                  {store.store_status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/artist/${store.artist_id}`}>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
