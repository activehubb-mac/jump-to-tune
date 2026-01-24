import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full">
      <Navbar />
      <div className="pt-16">
        <EmailVerificationBanner />
      </div>
      <main className={`flex-1 ${isPlayerVisible ? "pb-24 md:pb-20" : ""}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
