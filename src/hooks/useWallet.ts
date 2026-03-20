import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useConfetti } from "@/hooks/useConfetti";
import { useLowBalanceWarning } from "@/components/wallet/LowBalanceWarningModal";
import { openExternalUrl, getMobileHeaders } from "@/lib/platformBrowser";

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
  const { showFeedback } = useFeedbackSafe();
  const { fireConfetti } = useConfetti();
  const { checkAndShowWarning, showWarning, setShowWarning, warningData } = useLowBalanceWarning();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousBalanceRef = useRef<number | null>(null);
  
  const userId = user?.id;

  const { data, isLoading, error, refetch } = useQuery<WalletData>({
    queryKey: ["wallet", userId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        return { balance_cents: 0, transactions: [] };
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
    retry: (failureCount, err) => {
      if (String(err).includes("401") || String(err).includes("Not authenticated")) return false;
      return failureCount < 2;
    },
  });

  // Calculate average purchase for low balance threshold
  const averagePurchase = useCallback(() => {
    if (!data?.transactions) return undefined;
    const spendTransactions = data.transactions.filter(t => t.type === "spend");
    if (spendTransactions.length === 0) return undefined;
    const total = spendTransactions.reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);
    return Math.round(total / spendTransactions.length);
  }, [data?.transactions]);

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
          // Credits added - fire confetti!
          fireConfetti();
          const addedAmount = (currentBalance - previousBalance) / 100;
          showFeedback({
            type: "success",
            title: "Credits Added! 🎉",
            message: `$${addedAmount.toFixed(2)} credits have been added to your wallet.`,
            autoClose: true,
            autoCloseDelay: 4000,
          });
        } else {
          // Credits spent - check for low balance
          const spentAmount = (previousBalance - currentBalance) / 100;
          showFeedback({
            type: "info",
            title: "Purchase Complete",
            message: `$${spentAmount.toFixed(2)} credits used. Your new balance is $${(currentBalance / 100).toFixed(2)}.`,
            autoClose: true,
            autoCloseDelay: 4000,
          });
          
          // Check if we should show low balance warning after purchase
          setTimeout(() => {
            checkAndShowWarning(currentBalance, averagePurchase());
          }, 1000);
        }
      }
      
      previousBalanceRef.current = currentBalance;
    }
  }, [data?.balance_cents, showFeedback, fireConfetti, checkAndShowWarning, averagePurchase]);

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
          ...getMobileHeaders(),
        },
      });

      if (error) {
        // Extract the actual error message from the edge function response
        let errorMsg = "Failed to create checkout. Please try again.";
        try {
          if (error.context?.body) {
            const body = JSON.parse(error.context.body);
            if (body.error) errorMsg = body.error;
          }
        } catch {
          // fallback to generic message
        }
        if (!errorMsg && error.message) errorMsg = error.message;
        showFeedback({
          type: "error",
          title: "Purchase Failed",
          message: errorMsg,
          autoClose: true,
        });
        return null;
      }

      if (data?.url) {
        await openExternalUrl(data.url);
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
    // Low balance warning state
    showLowBalanceWarning: showWarning,
    setShowLowBalanceWarning: setShowWarning,
    lowBalanceWarningData: warningData,
  };
}
