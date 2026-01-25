import { ReactNode, lazy, Suspense } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { cn } from "@/lib/utils";

// Lazy load particle overlay for performance
const ParticleOverlay = lazy(() => 
  import("@/components/effects/ParticleOverlay").then(mod => ({ default: mod.ParticleOverlay }))
);

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  useBackground?: "futuristic" | "subtle" | "none";
  showParticles?: boolean;
}

export function Layout({ 
  children, 
  showFooter = true, 
  useBackground = "none",
  showParticles = false 
}: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  const backgroundClass = useBackground === "futuristic" 
    ? "bg-futuristic" 
    : useBackground === "subtle" 
    ? "bg-futuristic-subtle" 
    : "";

  // Show particles on futuristic backgrounds by default, but allow override
  const shouldShowParticles = showParticles || useBackground === "futuristic";
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-x-hidden w-full max-w-full relative",
      backgroundClass
    )}>
      {/* Particle effect overlay for immersive atmosphere */}
      {shouldShowParticles && (
        <Suspense fallback={null}>
          <ParticleOverlay particleCount={40} />
        </Suspense>
      )}
      
      <Navbar />
      <div 
        className="pt-16 relative z-10"
        style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <EmailVerificationBanner />
      </div>
      <main className={cn(
        "flex-1 relative z-10",
        isPlayerVisible ? "pb-24 md:pb-20" : ""
      )}>
        {children}
      </main>
      {showFooter && <Footer className="relative z-10" />}
    </div>
  );
}
