import { Link } from "react-router-dom";
import { Mic2, Music, Users, Trophy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/effects/FloatingCard";

const fanCategories = [
  { title: "Top Karaoke Videos", icon: Mic2, color: "text-primary" },
  { title: "Fan Remixes", icon: Music, color: "text-accent" },
  { title: "Trending Duets", icon: Users, color: "text-secondary" },
  { title: "Community Challenges", icon: Trophy, color: "text-primary" },
];

const placeholderCards = [
  { title: "Dark Drill Cover", creator: "BeatMaster_X", category: "Karaoke" },
  { title: "Chill R&B Remix", creator: "VibeQueen", category: "Remix" },
  { title: "Acoustic Duet", creator: "SoulSinger", category: "Duet" },
  { title: "Trap Challenge", creator: "808Wizard", category: "Challenge" },
  { title: "Lo-Fi Flip", creator: "ChillProducer", category: "Remix" },
  { title: "Vocal Cover", creator: "NightOwl", category: "Karaoke" },
];

export function FanZoneSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-7 h-7 text-accent" />
              Fan Zone
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Community creations, covers, and challenges
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/karaoke">Explore All</Link>
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {fanCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.title}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-card-bordered whitespace-nowrap hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(var(--primary)/0.1)] transition-all text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Icon className={`w-4 h-4 ${cat.color}`} />
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {placeholderCards.map((card, i) => (
            <FloatingCard
              key={i}
              depth="sm"
              glowColor="hsl(var(--accent) / 0.1)"
              className="group cursor-pointer"
            >
              <div className="rounded-xl border border-border/50 p-3 hover:bg-primary/5 transition-all duration-300">
                {/* Video Thumbnail */}
                <div className="aspect-[3/4] rounded-lg bg-muted/50 mb-3 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <Play className="w-10 h-10 text-muted-foreground/30" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground font-medium">
                      {card.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate">by {card.creator}</p>
              </div>
            </FloatingCard>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/karaoke">Explore Fan Zone</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
