import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

const LOW_BALANCE_CHECK_INTERVAL = 60000; // Check every minute
const MIN_THRESHOLD_CENTS = 100; // Minimum $1 threshold

export function useLowBalanceNotification() {
  const { user } = useAuth();
  const { balance, transactions, isLoading } = useWallet();
  const { showFeedback } = useFeedbackSafe();
  const lastNotifiedRef = useRef<number>(0);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || isLoading || hasCheckedRef.current) return;

    // Calculate average purchase amount from spending transactions
    const spendingTransactions = transactions.filter((t) => t.type === "spend");
    
    if (spendingTransactions.length === 0) {
      hasCheckedRef.current = true;
      return; // No purchase history yet
    }

    const totalSpent = spendingTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount_cents),
      0
    );
    const averagePurchase = Math.round(totalSpent / spendingTransactions.length);
    
    // Use the higher of average purchase or minimum threshold
    const threshold = Math.max(averagePurchase, MIN_THRESHOLD_CENTS);

    // Check if balance is below threshold
    if (balance < threshold && balance > 0) {
      const now = Date.now();
      // Don't notify more than once per hour
      if (now - lastNotifiedRef.current > 3600000) {
        lastNotifiedRef.current = now;
        
        // Show feedback modal with action
        showFeedback({
          type: "warning",
          title: `Low Credit Balance: $${(balance / 100).toFixed(2)}`,
          message: `Your balance is below your average purchase of $${(averagePurchase / 100).toFixed(2)}. Consider topping up!`,
          primaryAction: {
            label: "Top Up",
            onClick: () => {
              window.location.href = "/wallet";
            },
          },
          secondaryAction: {
            label: "Dismiss",
            onClick: () => {},
            variant: "outline",
          },
          autoClose: false,
        });

        // Create in-app notification
        createLowBalanceNotification(user.id, balance, averagePurchase);
      }
    }

    hasCheckedRef.current = true;
  }, [user, balance, transactions, isLoading, showFeedback]);
}

async function createLowBalanceNotification(
  userId: string,
  balance: number,
  averagePurchase: number
) {
  try {
    // Check if we already have an unread low balance notification
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "low_balance")
      .eq("read", false)
      .single();

    if (existing) return; // Already have an unread notification

    // Insert new notification using service role (via edge function if needed)
    // For now, we'll rely on the modal since RLS requires service_role for inserts
    // The notification system can be enhanced to support client-side inserts if needed
  } catch {
    // Ignore errors - notification is optional
  }
}
