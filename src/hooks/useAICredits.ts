import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AICreditsData {
  ai_credits: number;
  balance_cents: number;
  auto_reload_enabled?: boolean;
  auto_reload_threshold?: number;
}

export function useAICredits() {
  const { user } = useAuth();
  const autoReloadCheckedRef = useRef(false);

  const { data: walletData, isLoading, refetch } = useQuery<AICreditsData>({
    queryKey: ["ai-credits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_wallets")
        .select("ai_credits, balance_cents, auto_reload_enabled, auto_reload_threshold")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? { ai_credits: 0, balance_cents: 0 };
    },
    enabled: !!user,
    staleTime: 15000,
  });

  // Auto-reload check when credits are loaded and below threshold
  const triggerAutoReload = useCallback(async () => {
    if (!user) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      await supabase.functions.invoke("check-and-auto-reload", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
    } catch {
      // Silent fail — auto-reload is best-effort
    }
  }, [user]);

  useEffect(() => {
    if (!walletData || autoReloadCheckedRef.current) return;
    if (
      walletData.auto_reload_enabled &&
      walletData.auto_reload_threshold &&
      walletData.ai_credits < walletData.auto_reload_threshold
    ) {
      autoReloadCheckedRef.current = true;
      triggerAutoReload();
    }
  }, [walletData, triggerAutoReload]);

  return {
    aiCredits: walletData?.ai_credits ?? 0,
    balanceCents: walletData?.balance_cents ?? 0,
    isLoading,
    refetch,
    triggerAutoReload,
  };
}
