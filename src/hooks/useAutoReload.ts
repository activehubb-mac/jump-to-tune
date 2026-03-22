import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface AutoReloadSettings {
  auto_reload_enabled: boolean;
  auto_reload_threshold: number;
  auto_reload_pack_product_id: string | null;
  auto_reload_pack_credits: number | null;
}

export function useAutoReload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const { data: settings, isLoading } = useQuery<AutoReloadSettings>({
    queryKey: ["auto-reload-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_wallets")
        .select("auto_reload_enabled, auto_reload_threshold, auto_reload_pack_product_id, auto_reload_pack_credits")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? {
        auto_reload_enabled: false,
        auto_reload_threshold: 100,
        auto_reload_pack_product_id: null,
        auto_reload_pack_credits: null,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<AutoReloadSettings>) => {
      const { error } = await supabase
        .from("credit_wallets")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-reload-settings", user?.id] });
      showFeedback({ type: "success", title: "Saved", message: "Auto-reload settings updated.", autoClose: true });
    },
    onError: () => {
      showFeedback({ type: "error", title: "Error", message: "Failed to save settings.", autoClose: true });
    },
  });

  const triggerCheck = useCallback(async () => {
    if (!user) return null;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;
      const { data, error } = await supabase.functions.invoke("check-and-auto-reload", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }, [user]);

  return {
    settings: settings ?? {
      auto_reload_enabled: false,
      auto_reload_threshold: 100,
      auto_reload_pack_product_id: null,
      auto_reload_pack_credits: null,
    },
    isLoading,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    triggerCheck,
  };
}
