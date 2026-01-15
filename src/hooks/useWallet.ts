import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";

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
  const { showFeedback } = useFeedback();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousBalanceRef = useRef<number | null>(null);
  
  const userId = user?.id;

  const { data, isLoading, error, refetch } = useQuery<WalletData>({
    queryKey: ["wallet", userId],
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
    enabled: !!userId,
    staleTime: 30000,
  });

  // Track balance changes for notification and animation
  useEffect(() => {
    if (data?.balance_cents !== undefined) {
      const currentBalance = data.balance_cents;
      const previousBalance = previousBalanceRef.current;
      
      // Only process if not initial load
      if (previousBalance !== null && currentBalance !== previousBalance) {
        // Trigger pulse animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
        
        if (currentBalance > previousBalance) {
          // Credits added
          const addedAmount = (currentBalance - previousBalance) / 100;
          showFeedback({
            type: "success",
            title: "Credits Added!",
            message: `$${addedAmount.toFixed(2)} credits have been added to your wallet.`,
            autoClose: true,
            autoCloseDelay: 4000,
          });
        } else {
          // Credits spent
          const spentAmount = (previousBalance - currentBalance) / 100;
          showFeedback({
            type: "info",
            title: "Purchase Complete",
            message: `$${spentAmount.toFixed(2)} credits used. Your new balance is $${(currentBalance / 100).toFixed(2)}.`,
            autoClose: true,
            autoCloseDelay: 4000,
          });
        }
      }
      
      previousBalanceRef.current = currentBalance;
    }
  }, [data?.balance_cents, showFeedback]);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'credit_wallets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const purchaseCredits = useCallback(async (amountCents: number) => {
    setIsPurchasing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        showFeedback({
          type: "error",
          title: "Authentication Required",
          message: "Please sign in to purchase credits.",
          autoClose: true,
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { amount_cents: amountCents },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        showFeedback({
          type: "error",
          title: "Purchase Failed",
          message: error.message || "Failed to create checkout. Please try again.",
          autoClose: true,
        });
        return null;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      showFeedback({
        type: "error",
        title: "Error",
        message,
        autoClose: true,
      });
      return null;
    } finally {
      setIsPurchasing(false);
    }
  }, [showFeedback]);

  return {
    balance: data?.balance_cents ?? 0,
    balanceDollars: (data?.balance_cents ?? 0) / 100,
    transactions: data?.transactions ?? [],
    isLoading,
    isAnimating,
    error,
    refetch,
    purchaseCredits,
    isPurchasing,
  };
}
