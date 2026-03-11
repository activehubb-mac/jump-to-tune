import { Link } from "react-router-dom";
import { Mic2, Music, Users, Trophy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCardArtwork } from "@/hooks/useCardArtwork";
import { Skeleton } from "@/components/ui/skeleton";

const fanCategories = [
  { title: "Top Karaoke Videos", icon: Mic2, color: "text-primary" },
  { title: "Fan Remixes", icon: Music, color: "text-accent" },
  { title: "Trending Duets", icon: Users, color: "text-secondary" },
  { title: "Community Challenges", icon: Trophy, color: "text-primary" },
];

const placeholderCards = [
  {
    title: "Dark Drill Cover",
    creator: "BeatMaster_X",
    category: "Karaoke",
    fallbackGradient: "from-primary/40 via-accent/20 to-muted/30",
    artworkId: "fan-dark-drill",
    artworkPrompt: "Dark moody recording studio, purple neon glow, microphone silhouette, cinematic atmosphere, portrait orientation, no text",
  },
  {
    title: "Chill R&B Remix",
    creator: "VibeQueen",
    category: "Remix",
    fallbackGradient: "from-accent/40 via-secondary/20 to-muted/30",
    artworkId: "fan-chill-rnb",
    artworkPrompt: "Warm amber sunset skyline, vinyl record floating in air, smooth R&B aesthetic, dark moody atmosphere, portrait orientation, no text",
  },
  {
    title: "Acoustic Duet",
    creator: "SoulSinger",
    category: "Duet",
    fallbackGradient: "from-secondary/40 via-primary/20 to-muted/30",
    artworkId: "fan-acoustic-duet",
    artworkPrompt: "Two acoustic guitars side by side in warm candlelight, intimate wooden stage, golden bokeh, portrait orientation, no text",
  },
  {
    title: "Trap Challenge",
    creator: "808Wizard",
    category: "Challenge",
    fallbackGradient: "from-destructive/30 via-primary/20 to-muted/30",
    artworkId: "fan-trap-challenge",
    artworkPrompt: "Futuristic neon trap music scene, 808 bass visualizer, electric blue and red lights, dark urban aesthetic, portrait orientation, no text",
  },
  {
    title: "Lo-Fi Flip",
    creator: "ChillProducer",
    category: "Remix",
    fallbackGradient: "from-muted/50 via-accent/20 to-secondary/20",
    artworkId: "fan-lofi-flip",
    artworkPrompt: "Cozy lo-fi bedroom studio at night, rain on window, warm desk lamp glow, cassette tape and headphones, portrait orientation, no text",
  },
  {
    title: "Vocal Cover",
    creator: "NightOwl",
    category: "Karaoke",
    fallbackGradient: "from-primary/30 via-secondary/20 to-accent/20",
    artworkId: "fan-vocal-cover",
    artworkPrompt: "Singer silhouette on stage with dramatic spotlight beam, dark concert venue, smoke and purple haze, portrait orientation, no text",
  },
];

function FanCard({ card }: { card: typeof placeholderCards[0] }) {
  const { data: imageUrl, isLoading, isError, ref } = useCardArtwork({
    cardId: card.artworkId,
    prompt: card.artworkPrompt,
  });

  return (
    <div ref={ref} className="glass-card-bordered p-3 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
      <div className="aspect-[3/4] rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-lg" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${card.fallbackGradient} rounded-lg flex items-center justify-center`}>
            <Play className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
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
      <p className="text-xs text-muted-foreground truncate">
        by {card.creator}
      </p>
    </div>
  );
}

export function FanZoneSection() {
  return (
    <section className="py-16 md:py-24 bg-card/20">
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

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {fanCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.title}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-card-bordered whitespace-nowrap hover:bg-primary/10 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Icon className={`w-4 h-4 ${cat.color}`} />
                {cat.title}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {placeholderCards.map((card, i) => (
            <FanCard key={i} card={card} />
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
