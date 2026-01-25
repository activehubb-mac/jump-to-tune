import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";
import { Haptics, NotificationType } from "@capacitor/haptics";

/**
 * Hook to handle deep links when app resumes from external flows (Stripe, etc.)
 * Automatically refreshes wallet balance and navigates to appropriate pages
 */
export function useDeepLinkHandler() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle app URL open (deep link)
    const urlListener = App.addListener("appUrlOpen", async (event) => {
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);

      // Parse the deep link URL
      if (url.startsWith("jumtunes://")) {
        const path = url.replace("jumtunes://", "");
        
        // Trigger success haptic feedback
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          // Haptics not available
        }

        // Refresh wallet balance for any payment-related deep links
        if (path.includes("payment") || path.includes("subscription") || path.includes("wallet")) {
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["subscription"] });
          queryClient.invalidateQueries({ queryKey: ["owned-tracks"] });
        }

        // Navigate to appropriate page
        if (path === "payment-success") {
          navigate("/payment-success");
        } else if (path === "payment-canceled") {
          navigate("/payment-canceled");
        } else if (path === "subscription") {
          navigate("/subscription");
        } else if (path === "wallet") {
          navigate("/wallet");
        }
      }
    });

    // Handle app resume (when returning from external browser)
    const resumeListener = App.addListener("resume", async () => {
      console.log("[DeepLink] App resumed - refreshing data");
      
      // Small delay to ensure external browser is fully closed
      setTimeout(() => {
        // Refresh wallet and subscription data on resume
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }, 500);
    });

    return () => {
      urlListener.then((l) => l.remove());
      resumeListener.then((l) => l.remove());
    };
  }, [queryClient, navigate]);
}
