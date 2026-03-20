import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __BUILD_TIMESTAMP__: string;
console.log('[App] Build:', __BUILD_TIMESTAMP__);

async function nukeCachesAndReload() {
  console.log('[PWA] Version mismatch — clearing caches and reloading');

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }

  window.location.reload();
}

async function checkVersion(): Promise<boolean> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return false;
    const { v } = await res.json();
    const saved = localStorage.getItem('app-version');
    console.log('[PWA] Network version:', v, '| Saved:', saved);

    if (saved && saved !== v) {
      localStorage.setItem('app-version', v);
      await nukeCachesAndReload();
      return true; // reload triggered
    }

    localStorage.setItem('app-version', v);
    return false;
  } catch (e) {
    console.warn('[PWA] Version check failed (offline?), rendering anyway', e);
    return false;
  }
}

// Race: version check vs timeout fallback (3s)
const versionCheckPromise = checkVersion();
const timeoutPromise = new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000));

Promise.race([versionCheckPromise, timeoutPromise]).then((reloading) => {
  if (reloading) return; // page is reloading, don't render

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
});
