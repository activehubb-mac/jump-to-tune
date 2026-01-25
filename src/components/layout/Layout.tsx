import { ReactNode, lazy, Suspense } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { cn } from "@/lib/utils";

// Lazy load effects for performance
const ParticleOverlay = lazy(() => 
  import("@/components/effects/ParticleOverlay").then(mod => ({ default: mod.ParticleOverlay }))
);
const SpotlightOverlay = lazy(() => 
  import("@/components/effects/SpotlightOverlay").then(mod => ({ default: mod.SpotlightOverlay }))
);

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  useBackground?: "futuristic" | "subtle" | "none";
  showParticles?: boolean;
  showSpotlight?: boolean;
}

export function Layout({ 
  children, 
  showFooter = true, 
  useBackground = "none",
  showParticles = false,
  showSpotlight = true 
}: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  const backgroundClass = useBackground === "futuristic" 
    ? "bg-futuristic" 
    : useBackground === "subtle" 
    ? "bg-futuristic-subtle" 
    : "";

  // Show particles on futuristic backgrounds by default, but allow override
  const shouldShowParticles = showParticles || useBackground === "futuristic";
  // Show spotlight on any themed background by default
  const shouldShowSpotlight = showSpotlight && useBackground !== "none";
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-x-hidden w-full max-w-full",
      backgroundClass
    )}>
      {/* Mouse-following spotlight effect for desktop */}
      {shouldShowSpotlight && (
        <Suspense fallback={null}>
          <SpotlightOverlay />
        </Suspense>
      )}
      
      {/* Particle effect overlay for immersive atmosphere */}
      {shouldShowParticles && (
        <Suspense fallback={null}>
          <ParticleOverlay particleCount={40} />
        </Suspense>
      )}
      
      {/* Fixed Navbar - z-50 ensures it stays above everything */}
      <Navbar />
      
      {/* Main content wrapper with proper spacing for fixed navbar */}
      <div 
        className="flex-1 flex flex-col"
        style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <EmailVerificationBanner />
        <main className={cn(
          "flex-1",
          isPlayerVisible ? "pb-24 md:pb-20" : ""
        )}>
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
