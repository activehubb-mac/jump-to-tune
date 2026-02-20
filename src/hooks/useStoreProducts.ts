import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export interface StoreProduct {
  id: string;
  artist_id: string;
  type: string;
  title: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  audio_url: string | null;
  inventory_limit: number | null;
  inventory_sold: number;
  is_exclusive: boolean;
  is_early_release: boolean;
  variants: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateProductData {
  type: string;
  title: string;
  description?: string;
  price_cents: number;
  image_url?: string;
  audio_url?: string;
  inventory_limit?: number | null;
  is_exclusive?: boolean;
  is_early_release?: boolean;
  variants?: Record<string, unknown> | null;
}

export function useStoreProducts(artistId?: string, typeFilter?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const { data: products, isLoading } = useQuery({
    queryKey: ["store-products", artistId, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("store_products")
        .select("*")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StoreProduct[];
    },
    enabled: !!artistId,
  });

  const createProduct = useMutation({
    mutationFn: async (product: CreateProductData) => {
      const insertData: Record<string, unknown> = { ...product, artist_id: user!.id };
      if (product.variants) insertData.variants = product.variants as unknown;
      const { data, error } = await supabase
        .from("store_products")
        .insert(insertData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      showFeedback({ type: "success", title: "Product Created", message: "Your product is now live." });
    },
    onError: (err) => {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to create product" });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreProduct> & { id: string }) => {
      const updateData = { ...updates } as any;
      const { error } = await supabase
        .from("store_products")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      showFeedback({ type: "success", title: "Product Updated", message: "Changes saved." });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("store_products")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store-products"] }),
  });

  return { products: products ?? [], isLoading, createProduct, updateProduct, toggleActive };
}
