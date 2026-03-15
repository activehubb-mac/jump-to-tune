import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear audio cache when new service worker activates (fixes Safari cache corruption)
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[PWA] New service worker activated — reloading for latest UI');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
