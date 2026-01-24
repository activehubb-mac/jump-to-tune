import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Check if already installed or dismissed
    const isDismissed = localStorage.getItem("pwa-banner-dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isDismissed || isStandalone || isInWebAppiOS) {
      return;
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOSDevice) {
      setPlatform("ios");
      // Show on iOS Safari
      const isSafari = /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
      if (isSafari) {
        setIsVisible(true);
      }
      return;
    }
    
    if (isAndroid) {
      setPlatform("android");
    }

    // For Android/Desktop, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show banner after a delay for desktop/android even without beforeinstallprompt
    // This helps in iframe/preview environments where the event doesn't fire
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsVisible(false);
        localStorage.setItem("pwa-banner-dismissed", "true");
      }
      setDeferredPrompt(null);
    } else {
      // Navigate to install page for instructions
      navigate("/install");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  const getMessage = () => {
    switch (platform) {
      case "ios":
        return "Tap Share → Add to Home Screen";
      case "android":
        return "Install for quick access and offline support";
      default:
        return "Install our app for the best experience";
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card p-4 border border-primary/30 shadow-lg shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install JumTunes
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getMessage()}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="h-8 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {deferredPrompt ? "Install" : "Learn How"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="h-8 text-xs text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
