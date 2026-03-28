import { isNative, getPlatform } from "@/lib/platform";
import { supabase } from "@/integrations/supabase/client";

// RevenueCat entitlement lookup_keys (JumTunes LLC project) — map webhooks → tier.
export const RC_ENTITLEMENTS = {
  fan: "fan",
  artist: "artist",
  label: "label",
} as const;

// App Store / Test Store subscription product IDs (must match App Store Connect + RC).
// Google Play uses subscriptionId:basePlanId in RevenueCat — see RC_PLAY_SUBSCRIPTION_IDS.
export const RC_PRODUCTS = {
  subscriptions: {
    fan: "jumtunes_fan_monthly",
    artist: "jumtunes_artist_monthly",
    label: "jumtunes_label_monthly",
  },
  credits: {
    pack_100: "jumtunes_credits_100",
    pack_500: "jumtunes_credits_500",
    pack_2000: "jumtunes_credits_2000",
    starter: "jumtunes_starter_pack",
  },
} as const;

/** Play: RevenueCat store_identifier format is `subscriptionId:basePlanId`. Update if your base plan IDs differ. */
export const RC_PLAY_SUBSCRIPTION_IDS = {
  fan: "jumtunes_fan_monthly:monthly",
  artist: "jumtunes_artist_monthly:monthly",
  label: "jumtunes_label_monthly:monthly",
} as const;

let isInitialized = false;

export async function initPurchases(userId?: string): Promise<void> {
  if (!isNative() || isInitialized) return;

  try {
    const { Purchases, LOG_LEVEL } = await import(
      "@revenuecat/purchases-capacitor"
    );

    const platform = getPlatform();

    // Use the appropriate API key per platform
    // These should be set from env vars or a config file
    const apiKey =
      platform === "ios"
        ? (import.meta.env.VITE_REVENUECAT_IOS_KEY ?? "")
        : (import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "");

    if (!apiKey) {
      console.warn("[Purchases] No RevenueCat API key for", platform);
      return;
    }

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey, appUserID: userId ?? undefined });

    isInitialized = true;
    console.log("[Purchases] RevenueCat initialized");
  } catch (err) {
    console.error("[Purchases] Init failed:", err);
  }
}

export async function loginPurchases(userId: string): Promise<void> {
  if (!isNative() || !isInitialized) return;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.error("[Purchases] Login failed:", err);
  }
}

export async function logoutPurchases(): Promise<void> {
  if (!isNative() || !isInitialized) return;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.logOut();
  } catch (err) {
    console.error("[Purchases] Logout failed:", err);
  }
}

export async function getOfferings() {
  if (!isNative() || !isInitialized) return null;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.error("[Purchases] getOfferings failed:", err);
    return null;
  }
}

export async function purchasePackage(packageToPurchase: any) {
  if (!isNative() || !isInitialized) return null;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const result = await Purchases.purchasePackage({
      aPackage: packageToPurchase,
    });
    return result;
  } catch (err: any) {
    if (err?.code === "1" || err?.userCancelled) {
      return null;
    }
    throw err;
  }
}

export async function restorePurchases() {
  if (!isNative() || !isInitialized) return null;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (err) {
    console.error("[Purchases] Restore failed:", err);
    throw err;
  }
}

export async function getCustomerInfo() {
  if (!isNative() || !isInitialized) return null;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const info = await Purchases.getCustomerInfo();
    return info;
  } catch (err) {
    console.error("[Purchases] getCustomerInfo failed:", err);
    return null;
  }
}

/**
 * Sync a native purchase receipt with the backend so Supabase
 * can grant the entitlement (credits, subscription status, etc.)
 */
export async function syncPurchaseWithBackend(
  productId: string,
  transactionId: string,
  receipt: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "verify-native-purchase",
      {
        body: {
          productId,
          transactionId,
          receipt,
          platform: getPlatform(),
        },
      }
    );

    if (error) {
      console.error("[Purchases] Backend sync error:", error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error("[Purchases] Backend sync failed:", err);
    return false;
  }
}
