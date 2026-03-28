import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAPACITOR_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.jumtunes.app',
  appName: 'JumTunes',
  webDir: 'dist',

  ...(isDev
    ? {
        server: {
          url: 'https://cc620898-f7c7-430e-97e0-7eaf8a387695.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A0B',
    scheme: 'App',
    preferredContentMode: 'mobile',
  },

  android: {
    backgroundColor: '#0A0A0B',
    allowMixedContent: false,
  },

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#0A0A0B',
    },
  },
};

export default config;
