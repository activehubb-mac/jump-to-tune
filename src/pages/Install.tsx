import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus, 
  MoreVertical,
  Check,
  Apple,
  Monitor
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Install JumTunes</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get the full app experience with offline access, push notifications, and instant loading.
          </p>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-500">
                <Check className="w-6 h-6" />
                <div>
                  <p className="font-semibold">JumTunes is installed!</p>
                  <p className="text-sm text-muted-foreground">
                    You can find it on your home screen or app drawer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Install Button (for supported browsers) */}
        {deferredPrompt && !isInstalled && (
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <Button 
                onClick={handleInstall} 
                className="w-full gap-2" 
                size="lg"
                disabled={isInstalling}
              >
                <Download className="w-5 h-5" />
                {isInstalling ? "Installing..." : "Install JumTunes App"}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-3">
                Installs directly from your browser — no app store needed!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Platform-specific Instructions */}
        <div className="space-y-4">
          {/* iOS Instructions */}
          <Card className={platform === "ios" ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                <CardTitle className="text-lg">iPhone & iPad</CardTitle>
                {platform === "ios" && (
                  <Badge variant="secondary" className="ml-auto">Your Device</Badge>
                )}
              </div>
              <CardDescription>Safari browser required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <Share className="w-4 h-4" /> at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <Plus className="w-4 h-4" /> Add to Home Screen
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Tap "Add" to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    JumTunes will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card className={platform === "android" ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <CardTitle className="text-lg">Android</CardTitle>
                {platform === "android" && (
                  <Badge variant="secondary" className="ml-auto">Your Device</Badge>
                )}
              </div>
              <CardDescription>Chrome, Edge, or Samsung Internet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Tap the menu button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <MoreVertical className="w-4 h-4" /> in the top right corner
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-sm text-muted-foreground">
                    You may see a banner at the bottom instead
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Tap "Install" to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    JumTunes will appear in your app drawer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Instructions */}
          <Card className={platform === "desktop" ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                <CardTitle className="text-lg">Desktop</CardTitle>
                {platform === "desktop" && (
                  <Badge variant="secondary" className="ml-auto">Your Device</Badge>
                )}
              </div>
              <CardDescription>Chrome, Edge, or Brave</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Click the install icon in the address bar</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <Download className="w-4 h-4" /> on the right side of the URL bar
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Click "Install" in the popup</p>
                  <p className="text-sm text-muted-foreground">
                    JumTunes will open as a standalone app
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Offline Access</p>
                  <p className="text-sm text-muted-foreground">
                    Browse your library without internet
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Home Screen Icon</p>
                  <p className="text-sm text-muted-foreground">
                    Launch instantly like a native app
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new releases
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Faster Loading</p>
                  <p className="text-sm text-muted-foreground">
                    Cached assets load instantly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Native App Notice */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Looking for the native app? JumTunes will be available on the App Store and Google Play soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Install;
