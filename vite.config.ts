import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "images/jumtunes-logo.png"],
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
            src: "/images/jumtunes-logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/images/jumtunes-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ezamzkycxqrstuznqaha\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "NetworkFirst", // Changed from CacheFirst for Safari compatibility
            options: {
              cacheName: "audio-cache",
              networkTimeoutSeconds: 10, // Fallback to cache after 10s
              expiration: {
                maxEntries: 50, // Reduced from 100
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days instead of 30
              },
              cacheableResponse: {
                statuses: [200] // Only cache successful responses (removed status 0)
              }
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
