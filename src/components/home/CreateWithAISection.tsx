import { Link } from "react-router-dom";
import { useRef, useEffect } from "react";
import { Mic2, Music, Wand2, FileText, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const aiTools = [
  {
    title: "AI Karaoke",
    description: "Sing along with AI-powered instrumental isolation",
    icon: Mic2,
    href: "/karaoke",
    gradient: "from-primary/20 to-accent/20",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
    videoSrc: "/videos/ai-karaoke.mp4",
    playbackRate: 0.5,
  },
  {
    title: "Sing With Artist",
    description: "Duet with your favorite artists using AI voice sync",
    icon: Music,
    href: "/karaoke",
    gradient: "from-accent/20 to-secondary/20",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]",
    videoSrc: "/videos/ai-sing-with-artist.mp4",
    playbackRate: 1,
  },
  {
    title: "AI Remix",
    description: "Transform any track with AI-powered stem separation",
    icon: Wand2,
    href: "/ai-tools",
    gradient: "from-secondary/20 to-primary/20",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--secondary)/0.3)]",
    videoSrc: "/videos/ai-remix.mp4",
    playbackRate: 1,
  },
  {
    title: "AI Lyrics Generator",
    description: "Generate lyrics matched to any mood or genre",
    icon: FileText,
    href: "/ai-release",
    gradient: "from-primary/20 to-secondary/20",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
    videoSrc: "/videos/ai-lyrics.mp4",
    playbackRate: 0.5,
  },
  {
    title: "AI Cover Art",
    description: "Create stunning album artwork with AI generation",
    icon: Palette,
    href: "/ai-cover-art",
    gradient: "from-accent/20 to-primary/20",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]",
    videoSrc: "/videos/ai-cover-art.mp4",
    playbackRate: 1,
  },
];

function AIToolCard({ tool }: { tool: typeof aiTools[0] }) {
  const Icon = tool.icon;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = tool.playbackRate;
    }
  }, [tool.playbackRate]);

  return (
    <Link
      to={tool.href}
      className={cn(
        "group relative glass-card-bordered overflow-hidden block transition-all duration-500 hover:scale-[1.02]",
        tool.glowColor
      )}
    >
      {/* Video cover art on top */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <video
          ref={videoRef}
          src={tool.videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary group-hover:animate-pulse transition-colors z-10" />
      </div>

      {/* Content below */}
      <div className="relative p-5">
        {/* Gradient hover background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          tool.gradient
        )} />

        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {tool.title}
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
              {tool.description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CreateWithAISection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-bordered mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Create With <span className="text-gradient">AI</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interact with music like never before. Remix, sing, generate — powered by artificial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {aiTools.map((tool) => (
            <AIToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
