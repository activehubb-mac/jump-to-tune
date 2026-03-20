import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __BUILD_TIMESTAMP__: string;
console.log('[App] Build:', __BUILD_TIMESTAMP__);

// Guard: only reload once per SW activation
let hasReloaded = false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    // Listen for new SW installing
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated' && !hasReloaded) {
          hasReloaded = true;
          console.log('[PWA] New service worker activated, reloading');
          window.location.reload();
        }
      });
    });

    // Fallback: controllerchange (fires when a new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if (hasReloaded) return;
      hasReloaded = true;
      if ('caches' in window) {
        try {
          const deleted = await caches.delete('audio-cache');
          if (deleted) console.log('[PWA] Audio cache cleared on update');
        } catch (e) {
          console.warn('[PWA] Failed to clear audio cache:', e);
        }
      }
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
