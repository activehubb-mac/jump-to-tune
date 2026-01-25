import { useEffect } from "react";
import { Keyboard, KeyboardStyle, KeyboardResize } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";

interface KeyboardConfigOptions {
  /**
   * Hide the keyboard accessory bar (iOS only)
   * @default true
   */
  hideAccessoryBar?: boolean;
  /**
   * Resize behavior when keyboard is shown
   * @default KeyboardResize.Body
   */
  resizeMode?: KeyboardResize;
  /**
   * Scroll the focused element into view
   * @default true
   */
  scrollOnFocus?: boolean;
  /**
   * Keyboard style (iOS only)
   * @default KeyboardStyle.Dark
   */
  style?: KeyboardStyle;
}

/**
 * Configures native keyboard behavior for iOS/Android
 * Hides accessory bar by default for cleaner input experience
 */
export function useKeyboardConfig(options: KeyboardConfigOptions = {}) {
  const {
    hideAccessoryBar = true,
    resizeMode = KeyboardResize.Body,
    scrollOnFocus = true,
    style = KeyboardStyle.Dark,
  } = options;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const configureKeyboard = async () => {
      try {
        // Hide the keyboard accessory bar (Done/Next buttons on iOS)
        if (hideAccessoryBar) {
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
        }

        // Set resize mode
        await Keyboard.setResizeMode({ mode: resizeMode });

        // Enable/disable scroll to input on focus
        await Keyboard.setScroll({ isDisabled: !scrollOnFocus });

        // Set keyboard style (iOS only - matches app dark theme)
        if (Capacitor.getPlatform() === "ios") {
          await Keyboard.setStyle({ style });
        }
      } catch (error) {
        console.debug("Keyboard config not available:", error);
      }
    };

    configureKeyboard();

    // Cleanup: restore defaults
    return () => {
      if (!Capacitor.isNativePlatform()) return;
      
      const restoreDefaults = async () => {
        try {
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch {
          // Ignore cleanup errors
        }
      };
      restoreDefaults();
    };
  }, [hideAccessoryBar, resizeMode, scrollOnFocus, style]);
}

/**
 * Utility to manually hide the keyboard
 */
export async function hideKeyboard() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Keyboard.hide();
  } catch {
    // Keyboard hide not available
  }
}

/**
 * Utility to manually show the keyboard
 */
export async function showKeyboard() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Keyboard.show();
  } catch {
    // Keyboard show not available
  }
}
