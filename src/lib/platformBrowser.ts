import { Browser } from "@capacitor/browser";

/**
 * Detects if the app is running as a native Capacitor app
 */
export const isNativeApp = (): boolean => {
  return (
    typeof (window as any).Capacitor !== "undefined" &&
    (window as any).Capacitor.isNativePlatform()
  );
};

/**
 * Opens a URL in the appropriate browser based on platform
 * - Native: Uses Capacitor Browser plugin (opens external browser)
 * - Web: Falls back to window.open
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: "popover" });
  } else {
    window.open(url, "_blank");
  }
};

/**
 * Opens a URL for payment flows that need to return to the app
 * - Native: Uses external browser that can handle deep links
 * - Web: Redirects in same tab to preserve session
 */
export const openPaymentUrl = async (url: string): Promise<void> => {
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: "popover" });
  } else {
    // For web, redirect in same tab to preserve session
    window.location.href = url;
  }
};

/**
 * Returns headers to identify mobile app requests to edge functions
 */
export const getMobileHeaders = (): Record<string, string> => {
  if (isNativeApp()) {
    return { "x-jumtunes-mobile": "true" };
  }
  return {};
};

/**
 * Closes the in-app browser (useful after payment completion)
 */
export const closeExternalBrowser = async (): Promise<void> => {
  if (isNativeApp()) {
    try {
      await Browser.close();
    } catch {
      // Browser may already be closed
    }
  }
};
