import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { isNativeApp, closeExternalBrowser } from "@/lib/platformBrowser";

/**
 * Hook to handle deep links from jumtunes:// URL scheme
 * Used primarily for returning from Stripe checkout/portal
 */
export function useDeepLinkHandler() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isNativeApp()) return;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log("[DeepLink] Received:", url);

      // Close any open browser window
      await closeExternalBrowser();

      // Parse the deep link URL
      // Format: jumtunes://path?query=params
      const urlObj = new URL(url);
      const path = urlObj.hostname + urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Invalidate caches to refresh data after returning from external flow
      const invalidateKeys = [
        ["wallet"],
        ["subscription"],
        ["owned-tracks"],
        ["collection-stats"],
        ["purchases"],
      ];

      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Route based on deep link path
      switch (path) {
        case "payment-success":
        case "payment-success/": {
          const sessionId = searchParams.get("session_id");
          const type = searchParams.get("type");
          const credits = searchParams.get("credits");

          // Build the query string for the payment success page
          const queryString = new URLSearchParams();
          if (sessionId) queryString.set("session_id", sessionId);
          if (type) queryString.set("type", type);
          if (credits) queryString.set("credits", credits);

          navigate(`/payment-success?${queryString.toString()}`);
          break;
        }

        case "payment-canceled":
        case "payment-canceled/":
          navigate("/payment-canceled");
          break;

        case "subscription":
        case "subscription/":
          navigate("/subscription");
          break;

        case "wallet":
        case "wallet/":
          navigate("/wallet");
          break;

        default:
          // For unknown paths, try to navigate directly
          if (path && path !== "/") {
            navigate(`/${path}`);
          }
          break;
      }
    };

    // Listen for app URL open events
    const listener = App.addListener("appUrlOpen", handleDeepLink);

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate, queryClient]);
}
