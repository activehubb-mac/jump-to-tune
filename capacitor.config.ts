import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cc620898f7c7430e97e07eaf8a387695',
  appName: 'JumTunes',
  webDir: 'dist',
  server: {
    // Hot reload from Lovable preview during development
    url: 'https://cc620898-f7c7-430e-97e0-7eaf8a387695.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A0B'
  },
  android: {
    backgroundColor: '#0A0A0B'
  },
  plugins: {
    // Audio playback configuration
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
