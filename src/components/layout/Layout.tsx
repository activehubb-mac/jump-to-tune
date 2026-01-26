import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  /** @deprecated No longer used - kept for backward compatibility */
  useBackground?: "futuristic" | "subtle" | "none";
  /** @deprecated No longer used - kept for backward compatibility */
  showParticles?: boolean;
  /** @deprecated No longer used - kept for backward compatibility */
  showSpotlight?: boolean;
}

export function Layout({ 
  children, 
  showFooter = true,
  // These props are kept for backward compatibility but no longer used
  useBackground: _useBackground,
  showParticles: _showParticles,
  showSpotlight: _showSpotlight
}: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full bg-background">
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
