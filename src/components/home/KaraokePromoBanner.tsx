import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic2, Music, Sparkles } from "lucide-react";
import karaokeBg from "@/assets/karaoke-banner-bg.jpg";

export function KaraokePromoBanner() {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden glass-card-bordered p-8 md:p-12">
          {/* 3D Background with drift */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={karaokeBg}
              alt=""
              className="w-full h-full object-cover opacity-50 animate-card-drift"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/40" />
          </div>

          {/* Gradient sweep overlay */}
          <div className="absolute inset-0 animate-gradient-sweep z-[1]" />

          {/* Floating particle orbs */}
          {[
            { size: "w-3 h-3", top: "top-[15%]", left: "left-[70%]", dur: "4s", delay: "0s" },
            { size: "w-2 h-2", top: "top-[60%]", left: "left-[80%]", dur: "5s", delay: "1s" },
            { size: "w-4 h-4", top: "top-[30%]", left: "left-[90%]", dur: "6s", delay: "2s" },
            { size: "w-2 h-2", top: "top-[75%]", left: "left-[65%]", dur: "4.5s", delay: "0.5s" },
          ].map((orb, i) => (
            <div
              key={i}
              className={`absolute ${orb.size} ${orb.top} ${orb.left} rounded-full bg-primary/40 blur-[2px] particle-animate z-[2]`}
              style={{ animationDuration: orb.dur, animationDelay: orb.delay }}
            />
          ))}

          {/* Equalizer bars — right side */}
          <div className="absolute right-8 bottom-6 flex items-end gap-1 z-[2] opacity-40">
            {[0.6, 0.9, 0.4, 1, 0.7, 0.5, 0.8].map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-primary/70 rounded-full animate-equalizer origin-bottom"
                style={{
                  height: `${height * 40}px`,
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: `${0.6 + i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Floating music notes */}
          <div className="absolute top-4 right-8 opacity-20 z-[2]">
            <Music className="w-12 h-12 text-primary animate-bounce" style={{ animationDuration: "3s" }} />
          </div>
          <div className="absolute bottom-8 right-24 opacity-20 z-[2]">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            {/* Mic icon with pulsing ring */}
            <div className="shrink-0 relative">
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-pulse-ring" />
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 shadow-lg shadow-primary/20 relative z-10">
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
