import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Hook to configure the native status bar on iOS/Android
 * Sets dark style (light text) to match the app's dark theme
 */
export function useStatusBar() {
  useEffect(() => {
    const configureStatusBar = async () => {
      // Only run on native platforms (iOS/Android)
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Set status bar style to dark (light text on dark background)
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Allow web content to render behind status bar (for safe area handling)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // On Android, set the background color to match app theme
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0B0E1A' }); // matches --background (cosmic dark)
        }
      } catch (error) {
        console.warn('StatusBar configuration failed:', error);
      }
    };

    configureStatusBar();
  }, []);
}
