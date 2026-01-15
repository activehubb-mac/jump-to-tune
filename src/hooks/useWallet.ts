import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreditTransaction {
  id: string;
  type: "purchase" | "spend" | "refund";
  amount_cents: number;
  fee_cents: number;
  description: string;
  created_at: string;
}

interface WalletData {
  balance_cents: number;
  transactions: CreditTransaction[];
}

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<WalletData>({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("get-wallet-balance", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'credit_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wallet updated in real-time:', payload);
          // Invalidate and refetch wallet data
          queryClient.invalidateQueries({ queryKey: ["wallet", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const purchaseCredits = useCallback(async (amountCents: number) => {
    setIsPurchasing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please sign in to purchase credits");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { amount_cents: amountCents },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to create checkout");
        return null;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
      return null;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  return {
    balance: data?.balance_cents ?? 0,
    balanceDollars: (data?.balance_cents ?? 0) / 100,
    transactions: data?.transactions ?? [],
    isLoading,
    error,
    refetch,
    purchaseCredits,
    isPurchasing,
  };
}
