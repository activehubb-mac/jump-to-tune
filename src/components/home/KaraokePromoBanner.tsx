import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic2, Music, Sparkles } from "lucide-react";

export function KaraokePromoBanner() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-8 md:p-12">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-muted/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-muted/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
          
          {/* Floating music notes decoration */}
          <div className="absolute top-4 right-8 opacity-20">
            <Music className="w-12 h-12 text-primary animate-bounce" style={{ animationDuration: "3s" }} />
          </div>
          <div className="absolute bottom-8 right-24 opacity-20">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            {/* Icon */}
            <div className="shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 shadow-lg shadow-primary/20">
                <Mic2 className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3">
                <Sparkles className="w-3 h-3" />
                New Feature
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                🎤 Karaoke Mode is Here!
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Sing along with your favorite tracks! Enable Karaoke Mode to see synchronized lyrics and switch to instrumental versions for the ultimate sing-along experience.
              </p>
            </div>
            
            {/* CTA */}
            <div className="shrink-0">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/karaoke">
                  <Mic2 className="w-5 h-5 mr-2" />
                  Explore Sing-Along
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
