import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const buildVersion = Date.now().toString(36);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    // Generate version.json in public dir at build time
    {
      name: 'generate-version-json',
      buildStart() {
        fs.writeFileSync(
          path.resolve(__dirname, 'public/version.json'),
          JSON.stringify({ v: buildVersion })
        );
      }
    },
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "images/jumtunes-app-icon.png"],
      manifest: {
        name: "JumTunes",
        short_name: "JumTunes",
        description: "Buy music directly from independent artists. Own what you love forever. 85% goes to creators.",
        theme_color: "#0A0A0B",
        background_color: "#0A0A0B",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["music", "entertainment"],
        icons: [
          {
            src: "/images/jumtunes-app-icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/jumtunes-app-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/_nocache=/, /^\/~oauth/, /version\.json/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: "NetworkFirst",
            options: {
              cacheName: "navigation-cache",
              networkTimeoutSeconds: 3,
            }
          },
          {
            urlPattern: ({ url }) => {
              const isSupabaseStorage = url.hostname === 'ezamzkycxqrstuznqaha.supabase.co' && 
                                        url.pathname.includes('/storage/v1/object/public/');
              const hasCacheBuster = url.search.includes('_nocache=');
              return isSupabaseStorage && !hasCacheBuster;
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "audio-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [200]
              },
              rangeRequests: true
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
