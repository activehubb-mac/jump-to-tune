import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear audio cache when new service worker activates (fixes Safari cache corruption)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if ('caches' in window) {
        try {
          const deleted = await caches.delete('audio-cache');
          if (deleted) {
            console.log('[PWA] Audio cache cleared on update');
          }
        } catch (e) {
          console.warn('[PWA] Failed to clear audio cache:', e);
        }
      }
      // Reload to ensure latest UI is shown
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
