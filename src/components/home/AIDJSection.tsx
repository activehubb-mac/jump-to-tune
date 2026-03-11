import { useState } from "react";
import { Sparkles, Send, Disc3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FloatingCard } from "@/components/effects/FloatingCard";

const examplePrompts = [
  "Play dark drill music",
  "Create a gym playlist",
  "Play emotional R&B",
  "Chill late-night vibe playlist",
  "Futuristic trap beats",
  "Acoustic love songs",
];

export function AIDJSection() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate(`/browse?q=${encodeURIComponent(prompt.trim())}`);
    }
  };

  const handlePromptClick = (p: string) => {
    navigate(`/browse?q=${encodeURIComponent(p)}`);
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-bordered mb-4">
              <Disc3 className="w-4 h-4 text-accent animate-spin" style={{ animationDuration: "4s" }} />
              <span className="text-sm font-medium text-accent">Intelligent Discovery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              AI <span className="text-gradient">DJ</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Describe the vibe. We'll build the playlist.
            </p>
          </div>

          {/* Holographic Command Interface */}
          <FloatingCard depth="lg" glowColor="hsl(var(--accent) / 0.15)" className="mb-8">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative rounded-xl border border-border/50 overflow-hidden holographic-panel p-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary ml-4 shrink-0" />
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="What do you want to hear?"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-muted-foreground/50"
                  />
                  <Button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="gradient-accent shrink-0 mr-1"
                    size="lg"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </form>
          </FloatingCard>

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-2">
            {examplePrompts.map((p) => (
              <button
                key={p}
                onClick={() => handlePromptClick(p)}
                className="px-4 py-2 rounded-full glass-card-bordered text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all duration-300"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
