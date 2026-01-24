import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cc620898f7c7430e97e07eaf8a387695',
  appName: 'JumTunes',
  webDir: 'dist',
  
  // Hot reload from Lovable preview during development
  // REMOVE this server block for production builds!
  server: {
    url: 'https://cc620898-f7c7-430e-97e0-7eaf8a387695.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A0B',
    // Deep linking scheme
    scheme: 'jumtunes'
  },

  android: {
    backgroundColor: '#0A0A0B',
    // Allow cleartext for development
    allowMixedContent: true
  },

  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
