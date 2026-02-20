import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface ArtistStore {
  id: string;
  artist_id: string;
  store_status: string;
  platform_fee_percentage: number;
  seller_agreement_accepted: boolean;
  seller_agreement_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useArtistStore(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();
  const id = artistId || user?.id;

  const { data: store, isLoading } = useQuery({
    queryKey: ["artist-store", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_stores")
        .select("*")
        .eq("artist_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as ArtistStore | null;
    },
    enabled: !!id,
  });

  const createStore = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("artist_stores")
        .insert({ artist_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artist-store"] }),
  });

  const activateStore = useMutation({
    mutationFn: async (accepted: boolean) => {
      if (!store) {
        // Create store first
        const { data: newStore, error: createError } = await supabase
          .from("artist_stores")
          .insert({
            artist_id: user!.id,
            store_status: accepted ? "active" : "inactive",
            seller_agreement_accepted: accepted,
            seller_agreement_accepted_at: accepted ? new Date().toISOString() : null,
          })
          .select()
          .single();
        if (createError) throw createError;
        return newStore;
      }
      const { data, error } = await supabase
        .from("artist_stores")
        .update({
          store_status: accepted ? "active" : "inactive",
          seller_agreement_accepted: accepted,
          seller_agreement_accepted_at: accepted ? new Date().toISOString() : null,
        })
        .eq("id", store.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-store"] });
      showFeedback({ type: "success", title: "Store Updated", message: "Your store status has been updated." });
    },
    onError: (err) => {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to update store" });
    },
  });

  const deactivateStore = useMutation({
    mutationFn: async () => {
      if (!store) return;
      const { error } = await supabase
        .from("artist_stores")
        .update({ store_status: "inactive" })
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-store"] });
      showFeedback({ type: "success", title: "Store Deactivated", message: "Your store is now hidden from fans." });
    },
  });

  return {
    store,
    isLoading,
    isActive: store?.store_status === "active",
    createStore,
    activateStore,
    deactivateStore,
  };
}
