import { Link } from "react-router-dom";
import { Mic2, Music, Wand2, FileText, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingCard } from "@/components/effects/FloatingCard";

const aiTools = [
  {
    title: "AI Karaoke",
    description: "Sing along with AI-powered instrumental isolation",
    icon: Mic2,
    href: "/karaoke",
    accentVar: "--primary",
  },
  {
    title: "Sing With Artist",
    description: "Duet with your favorite artists using AI voice sync",
    icon: Music,
    href: "/karaoke",
    accentVar: "--accent",
  },
  {
    title: "AI Remix",
    description: "Transform any track with AI-powered stem separation",
    icon: Wand2,
    href: "/ai-tools",
    accentVar: "--secondary",
  },
  {
    title: "AI Lyrics Generator",
    description: "Generate lyrics matched to any mood or genre",
    icon: FileText,
    href: "/ai-release",
    accentVar: "--primary",
  },
  {
    title: "AI Cover Art",
    description: "Create stunning album artwork with AI generation",
    icon: Palette,
    href: "/ai-cover-art",
    accentVar: "--accent",
  },
];

export function CreateWithAISection() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
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

        {/* Holographic AI Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <FloatingCard
                key={tool.title}
                glowColor={`hsl(var(${tool.accentVar}) / 0.2)`}
                depth="lg"
                className="group"
              >
                <Link
                  to={tool.href}
                  className="block relative p-8 rounded-xl border border-border/50 overflow-hidden holographic-panel"
                >
                  {/* Holographic scanline effect */}
                  <div className="absolute inset-0 holographic-scanline pointer-events-none" />

                  {/* Gradient border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(${tool.accentVar}) / 0.08) 0%, transparent 50%, hsl(var(${tool.accentVar}) / 0.05) 100%)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: `linear-gradient(135deg, hsl(var(${tool.accentVar}) / 0.2) 0%, hsl(var(${tool.accentVar}) / 0.05) 100%)`,
                        boxShadow: `0 0 20px hsl(var(${tool.accentVar}) / 0.1)`,
                      }}
                    >
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Floating status dot */}
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary group-hover:animate-pulse transition-colors">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2s" }} />
                  </div>
                </Link>
              </FloatingCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
