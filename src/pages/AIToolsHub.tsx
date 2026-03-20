import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { Sparkles, Image, User, ListMusic, Video, Music, Zap, Lock, Rocket, Plus, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingTier {
  label: string;
  credits: number;
}

interface AITool {
  title: string;
  desc: string;
  icon: React.ElementType;
  credits: number | string;
  href: string;
  roles: string[];
  pricingTiers?: PricingTier[];
  isPremium?: boolean;
  valueFrame?: string;
}

const AI_TOOLS: AITool[] = [
  {
    title: "AI Video Studio",
    desc: "Generate cinematic AI music videos synced to your track",
    icon: Clapperboard,
    credits: "Starts at 130",
    href: "/ai-video",
    roles: ["artist", "label"],
    isPremium: true,
    valueFrame: "Optimized for TikTok, Reels & Shorts",
    pricingTiers: [
      { label: "10s (480p)", credits: 130 },
      { label: "15s (480p)", credits: 180 },
      { label: "20s (480p)", credits: 240 },
      { label: "HD (720p)", credits: 400 },
    ],
  },
  {
    title: "AI Viral Generator",
    desc: "Turn songs into TikTok, IG Reels & YouTube Shorts promo clips",
    icon: Rocket,
    credits: "Starts at 500",
    href: "/ai-viral",
    roles: ["artist", "label"],
    valueFrame: "Designed to help your content go viral",
    pricingTiers: [
      { label: "3 Clips", credits: 500 },
      { label: "5 Clips", credits: 850 },
    ],
  },
  {
    title: "AI Playlist Builder",
    desc: "Describe a mood and AI creates a curated playlist",
    icon: ListMusic,
    credits: 5,
    href: "/ai-playlist",
    roles: ["artist", "label", "fan"],
  },
  {
    title: "AI Release Builder",
    desc: "Generate cover art, titles, descriptions, and tags for your release",
    icon: Music,
    credits: 10,
    href: "/ai-release",
    roles: ["artist", "label"],
  },
  {
    title: "Cover Art Generator",
    desc: "Create stunning AI cover art for your tracks and albums",
    icon: Image,
    credits: 10,
    href: "/ai-cover-art",
    roles: ["artist", "label"],
  },
  {
    title: "AI Identity Builder",
    desc: "Generate your unique artist name, avatar, bio, and visual theme",
    icon: User,
    credits: 15,
    href: "/ai-identity",
    roles: ["artist", "label"],
  },
];

export default function AIToolsHub() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading } = useAICredits();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const usdEquivalent = (aiCredits / 100).toFixed(2);
  const progressMax = 2000;
  const progressPercent = Math.min((aiCredits / progressMax) * 100, 100);

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Credit Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" /> AI Tools
          </h1>
          <p className="text-muted-foreground mt-2">Powerful AI tools to build your music brand</p>

          {user && (
            <div className="mt-4 inline-flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? "..." : aiCredits.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">credits</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ ${isLoading ? "..." : usdEquivalent}
                  </p>
                </div>
                <Button asChild size="sm" className="bg-primary text-primary-foreground gap-1.5">
                  <Link to="/wallet">
                    <Plus className="h-3.5 w-3.5" /> Buy Credits
                  </Link>
                </Button>
              </div>
              <Progress
                value={isLoading ? 0 : progressPercent}
                className="h-1.5 w-48 bg-muted"
              />
            </div>
          )}
        </div>

        {!user ? (
          <div className="text-center py-12">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Sign in to access AI tools</h2>
            <Button asChild className="bg-primary text-primary-foreground">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_TOOLS.map((tool, idx) => {
              const Icon = tool.icon;
              const hasAccess = tool.roles.includes(role || "fan");
              const isHovered = hoveredIdx === idx;
              const anyHovered = hoveredIdx !== null;

              return (
                <Link
                  key={tool.href}
                  to={hasAccess ? tool.href : "#"}
                  className={cn(
                    !hasAccess && "pointer-events-none opacity-50",
                    "block"
                  )}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <Card
                    className={cn(
                      "border transition-all duration-300 h-full cursor-pointer relative overflow-hidden",
                      "bg-card/60 backdrop-blur-sm",
                      tool.isPremium
                        ? "border-[hsl(45,80%,50%,0.3)] shadow-[0_0_20px_hsl(45,80%,50%,0.15)]"
                        : "border-border",
                      isHovered && tool.isPremium && "shadow-[0_0_30px_hsl(45,80%,50%,0.3)] border-[hsl(45,80%,50%,0.5)] -translate-y-1",
                      isHovered && !tool.isPremium && "border-primary/50 -translate-y-0.5 shadow-md",
                      anyHovered && !isHovered && "opacity-60",
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2.5 rounded-lg transition-colors",
                          tool.isPremium
                            ? "bg-[hsl(45,80%,50%,0.1)] text-[hsl(45,80%,60%)]"
                            : "bg-primary/10 text-primary",
                          isHovered && tool.isPremium && "bg-[hsl(45,80%,50%,0.2)]",
                          isHovered && !tool.isPremium && "bg-primary/20",
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-sm">{tool.title}</h3>
                            {tool.isPremium && (
                              <Badge className="bg-[hsl(45,80%,50%)] text-[hsl(45,80%,10%)] text-[10px] px-1.5 py-0 h-4 font-bold">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.desc}</p>

                          <Badge variant="secondary" className="mt-2 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {typeof tool.credits === "number" ? `${tool.credits} credits` : tool.credits}
                          </Badge>

                          {tool.valueFrame && (
                            <p className="text-[10px] text-primary/70 mt-1.5 font-medium">{tool.valueFrame}</p>
                          )}
                        </div>
                      </div>

                      {/* Pricing tier breakdown on hover */}
                      {tool.pricingTiers && (
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300 ease-out",
                            isHovered ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
                          )}
                        >
                          <div className="border-t border-border/50 pt-2.5 space-y-1">
                            {tool.pricingTiers.map((tier) => (
                              <div key={tier.label} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{tier.label}</span>
                                <span className="text-foreground font-medium">{tier.credits} credits</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasAccess && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <Lock className="h-3 w-3" />Artist access required
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
