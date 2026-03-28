import { useState, useEffect, useCallback } from "react";
import { isNative } from "@/lib/platform";
import { useAuth } from "@/contexts/AuthContext";
import {
  initPurchases,
  loginPurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
} from "@/lib/nativePurchases";

export function useNativePurchase() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (!isNative()) return;

    const init = async () => {
      await initPurchases(user?.id);
      if (user?.id) {
        await loginPurchases(user.id);
      }
      setIsReady(true);
    };

    init();
  }, [user?.id]);

  const loadOfferings = useCallback(async () => {
    if (!isReady) return null;
    const result = await getOfferings();
    setOfferings(result);
    return result;
  }, [isReady]);

  const purchase = useCallback(
    async (pkg: any) => {
      setIsPurchasing(true);
      try {
        const result = await purchasePackage(pkg);
        return result;
      } finally {
        setIsPurchasing(false);
      }
    },
    []
  );

  const restore = useCallback(async () => {
    return restorePurchases();
  }, []);

  const getInfo = useCallback(async () => {
    return getCustomerInfo();
  }, []);

  return {
    isNativeBilling: isNative(),
    isReady,
    offerings,
    isPurchasing,
    loadOfferings,
    purchase,
    restore,
    getInfo,
  };
}
