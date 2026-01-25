import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  useBackground?: "futuristic" | "subtle" | "none";
}

export function Layout({ children, showFooter = true, useBackground = "none" }: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  const backgroundClass = useBackground === "futuristic" 
    ? "bg-futuristic" 
    : useBackground === "subtle" 
    ? "bg-futuristic-subtle" 
    : "";
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-x-hidden w-full max-w-full",
      backgroundClass
    )}>
      <Navbar />
      <div 
        className="pt-16"
        style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <EmailVerificationBanner />
      </div>
      <main className={`flex-1 ${isPlayerVisible ? "pb-24 md:pb-20" : ""}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
