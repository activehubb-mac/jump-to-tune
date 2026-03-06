import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { Sparkles, Image, User, ListMusic, Video, Music, Zap, Lock, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const AI_TOOLS = [
  { title: "AI Release Builder", desc: "Generate cover art, titles, descriptions, and tags for your release", icon: Music, credits: 5, href: "/ai-release", roles: ["artist", "label"] },
  { title: "Cover Art Generator", desc: "Create stunning AI cover art for your tracks and albums", icon: Image, credits: 3, href: "/ai-cover-art", roles: ["artist", "label"] },
  { title: "AI Identity Builder", desc: "Generate your unique artist name, avatar, bio, and visual theme", icon: User, credits: 5, href: "/ai-identity", roles: ["artist", "label"] },
  { title: "AI Playlist Builder", desc: "Describe a mood and AI creates a curated playlist", icon: ListMusic, credits: 3, href: "/ai-playlist", roles: ["artist", "label", "fan"] },
  { title: "AI Video Generator", desc: "Generate short music videos and social visualizers", icon: Video, credits: "20-100", href: "/ai-video", roles: ["artist", "label"] },
  { title: "AI Viral Generator", desc: "Turn songs into TikTok, IG Reels & YouTube Shorts promo clips", icon: Rocket, credits: "20-100", href: "/ai-viral", roles: ["artist", "label"] },
];

export default function AIToolsHub() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading } = useAICredits();

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" /> AI Tools
          </h1>
          <p className="text-muted-foreground mt-2">Powerful AI tools to build your music brand</p>
          {user && (
            <Badge variant="outline" className="mt-3 border-primary/50 text-primary text-sm">
              <Zap className="h-3.5 w-3.5 mr-1" />{isLoading ? "..." : aiCredits} credits available
            </Badge>
          )}
        </div>

        {!user ? (
          <div className="text-center py-12">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Sign in to access AI tools</h2>
            <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const hasAccess = tool.roles.includes(role || "fan");
              return (
                <Link key={tool.href} to={hasAccess ? tool.href : "#"} className={!hasAccess ? "pointer-events-none opacity-50" : ""}>
                  <Card className="glass hover:border-primary/50 transition-all duration-300 h-full group cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">{tool.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.desc}</p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            <Zap className="h-3 w-3 mr-1" />{tool.credits} credits
                          </Badge>
                        </div>
                      </div>
                      {!hasAccess && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1"><Lock className="h-3 w-3" />Artist access required</p>
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
