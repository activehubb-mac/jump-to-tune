import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { PromotedAvatars } from "@/components/effects/PromotedAvatars";
import { FeaturedArtistSlideshow } from "@/components/effects/FeaturedArtistSlideshow";
import { GlobalSubscriptionCheck } from "@/components/subscription/GlobalSubscriptionCheck";
import { JumBot } from "@/components/jumbot/JumBot";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ 
  children, 
  showFooter = true
}: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full">
      <GlobalSubscriptionCheck />
      {!isAdmin && <ParticleBackground />}
      {!isAdmin && <FeaturedArtistSlideshow />}
      {!isAdmin && <PromotedAvatars />}
      
      <Navbar />
      
      <div 
        className="flex-1 flex flex-col relative"
        style={{
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
          zIndex: 2,
          backgroundColor: isAdmin ? 'hsl(0 0% 0%)' : 'transparent',
        }}
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

      <JumBot />
    </div>
  );
}
