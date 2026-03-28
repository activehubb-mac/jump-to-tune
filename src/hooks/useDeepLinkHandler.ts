import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { isNativeApp, closeExternalBrowser } from "@/lib/platformBrowser";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to handle deep links from jumtunes:// URL scheme
 * Handles auth callbacks, payment returns, and general navigation
 */
export function useDeepLinkHandler() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isNativeApp()) return;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log("[DeepLink] Received:", url);

      await closeExternalBrowser();

      const urlObj = new URL(url);
      const path = urlObj.hostname + urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Handle Supabase auth tokens arriving via deep link
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      if (accessToken && refreshToken) {
        console.log("[DeepLink] Setting session from auth tokens");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error("[DeepLink] Auth session error:", error);
        }

        const tokenType = searchParams.get("type");
        if (tokenType === "recovery") {
          navigate("/auth/reset-password");
          return;
        }

        navigate("/auth/callback");
        return;
      }

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

      switch (path) {
        case "payment-success":
        case "payment-success/": {
          const sessionId = searchParams.get("session_id");
          const type = searchParams.get("type");
          const credits = searchParams.get("credits");

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

        case "auth/callback":
        case "auth/callback/":
          navigate("/auth/callback");
          break;

        case "auth/reset-password":
        case "auth/reset-password/":
          navigate("/auth/reset-password");
          break;

        default:
          if (path && path !== "/") {
            navigate(`/${path}`);
          }
          break;
      }
    };

    const listener = App.addListener("appUrlOpen", handleDeepLink);

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate, queryClient]);
}
