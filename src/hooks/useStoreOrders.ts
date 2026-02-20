import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export interface StoreOrder {
  id: string;
  product_id: string;
  buyer_id: string;
  artist_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  status: string;
  shipping_address: Record<string, unknown> | null;
  buyer_name: string | null;
  buyer_email: string | null;
  edition_number: number | null;
  created_at: string;
  product?: { title: string; type: string; image_url: string | null };
}

export function useStoreOrders(artistId?: string, statusFilter?: string) {
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["store-orders", artistId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("store_orders")
        .select("*, product:store_products(title, type, image_url)")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StoreOrder[];
    },
    enabled: !!artistId,
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("store_orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-orders"] });
      showFeedback({ type: "success", title: "Order Updated", message: "Order status has been updated." });
    },
    onError: (err) => {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to update order" });
    },
  });

  return { orders: orders ?? [], isLoading, updateOrderStatus };
}
