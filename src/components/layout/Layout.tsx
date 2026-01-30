import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
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
  
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full relative">
      {/* Glow Orbs - Premium Background Effect */}
      <div 
        className="fixed pointer-events-none rounded-full opacity-60"
        style={{
          width: '800px',
          height: '800px',
          background: 'rgba(138, 180, 255, 0.18)',
          filter: 'blur(120px)',
          top: '-200px',
          left: '-200px',
          zIndex: -3,
        }}
      />
      <div 
        className="fixed pointer-events-none rounded-full opacity-60"
        style={{
          width: '800px',
          height: '800px',
          background: 'rgba(255, 200, 120, 0.16)',
          filter: 'blur(120px)',
          bottom: '-300px',
          right: '-300px',
          zIndex: -3,
        }}
      />
      
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
