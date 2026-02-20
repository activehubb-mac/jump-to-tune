import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

export function useStoreCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { showFeedback } = useFeedbackSafe();
  const { user } = useAuth();

  const checkout = async (productId: string, quantity = 1) => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign In Required", message: "Please sign in to purchase." });
      return;
    }

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-store-checkout", {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { productId, quantity },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      showFeedback({
        type: "error",
        title: "Checkout Failed",
        message: err instanceof Error ? err.message : "Failed to start checkout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading };
}
