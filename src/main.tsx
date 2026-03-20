import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __BUILD_TIMESTAMP__: string;
console.log('[App] Build:', __BUILD_TIMESTAMP__);

const currentBuild = __BUILD_TIMESTAMP__;
const savedBuild = localStorage.getItem('app-build');

async function nukeCachesAndReload() {
  console.log('[PWA] Build mismatch — clearing caches and reloading');
  localStorage.setItem('app-build', currentBuild);

  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
  }

  // Delete all caches
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }

  window.location.reload();
}

if (savedBuild && savedBuild !== currentBuild) {
  // Build changed — nuke everything before painting any UI
  nukeCachesAndReload();
} else {
  // First visit or same build — store and render
  localStorage.setItem('app-build', currentBuild);

  // Guard: only reload once per SW activation
  let hasReloaded = false;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
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
}
