import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  const { isPlayerVisible } = useAudioPlayer();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 pt-16 ${isPlayerVisible ? "pb-24 md:pb-20" : ""}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
