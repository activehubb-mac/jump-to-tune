import { useState, useCallback, useRef, useEffect } from "react";
import { useIsMobile } from "./use-mobile";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only enable pull-to-refresh on mobile and when at top of scroll
      if (!isMobile || state.isRefreshing) return;
      
      const container = containerRef.current;
      if (!container) return;
      
      // Check if we're at the top of the scrollable area
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;

      startY.current = e.touches[0].clientY;
      setState((prev) => ({ ...prev, isPulling: true }));
    },
    [isMobile, state.isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!state.isPulling || state.isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only allow pulling down
      if (diff < 0) {
        setState((prev) => ({ ...prev, pullDistance: 0, canRefresh: false }));
        return;
      }

      // Apply resistance to make it feel natural
      const resistance = 0.5;
      const pullDistance = Math.min(diff * resistance, maxPull);
      const canRefresh = pullDistance >= threshold;

      setState((prev) => ({ ...prev, pullDistance, canRefresh }));

      // Prevent default scrolling while pulling
      if (pullDistance > 0) {
        e.preventDefault();
      }
    },
    [state.isPulling, state.isRefreshing, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling) return;

    if (state.canRefresh && !state.isRefreshing) {
      setState((prev) => ({ ...prev, isRefreshing: true, pullDistance: threshold }));
      
      // Trigger haptic feedback for native feel - medium impact when refresh starts
      if (Capacitor.isNativePlatform()) {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
          // Haptics not available
        }
      }
      
      try {
        await onRefresh();
        // Success haptic when refresh completes
        if (Capacitor.isNativePlatform()) {
          try {
            await Haptics.notification({ type: NotificationType.Success });
          } catch {
            // Haptics not available
          }
        }
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
      });
    }
  }, [state.isPulling, state.canRefresh, state.isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    // Use passive: false to allow preventDefault on touchmove
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state,
    pullProgress: Math.min(state.pullDistance / threshold, 1),
  };
}
