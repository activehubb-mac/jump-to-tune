import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

/**
 * Hook for triggering haptic feedback on native iOS/Android
 * Falls back silently on web
 */
export function useHapticFeedback() {
  const isNative = Capacitor.isNativePlatform();

  const impact = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics not available
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type });
    } catch {
      // Haptics not available
    }
  };

  const selectionStart = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
    } catch {
      // Haptics not available
    }
  };

  const selectionChanged = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch {
      // Haptics not available
    }
  };

  const selectionEnd = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionEnd();
    } catch {
      // Haptics not available
    }
  };

  return {
    impact,
    notification,
    selectionStart,
    selectionChanged,
    selectionEnd,
    isNative,
    // Convenience methods
    lightTap: () => impact(ImpactStyle.Light),
    mediumTap: () => impact(ImpactStyle.Medium),
    heavyTap: () => impact(ImpactStyle.Heavy),
    success: () => notification(NotificationType.Success),
    warning: () => notification(NotificationType.Warning),
    error: () => notification(NotificationType.Error),
  };
}
