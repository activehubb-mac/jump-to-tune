import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Heart, Download, Music, Users, TrendingUp, Palette, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ColorToken {
  name: string;
  variable: string;
  description: string;
}

const colorTokens: ColorToken[] = [
  { name: "Background", variable: "--background", description: "Main page background" },
  { name: "Foreground", variable: "--foreground", description: "Primary text color" },
  { name: "Card", variable: "--card", description: "Card backgrounds" },
  { name: "Primary", variable: "--primary", description: "Primary brand color (buttons, links)" },
  { name: "Secondary", variable: "--secondary", description: "Secondary accent color" },
  { name: "Accent", variable: "--accent", description: "Highlight/neon accent" },
  { name: "Muted", variable: "--muted", description: "Muted backgrounds" },
  { name: "Muted Foreground", variable: "--muted-foreground", description: "Muted text" },
  { name: "Border", variable: "--border", description: "Border colors" },
  { name: "Destructive", variable: "--destructive", description: "Error/danger states" },
  { name: "Neon Glow", variable: "--neon-glow", description: "Glow effects" },
  { name: "Electric Blue", variable: "--electric-blue", description: "Secondary accent" },
  { name: "Deep Purple", variable: "--deep-purple", description: "Gradient base" },
  { name: "Glass", variable: "--glass", description: "Glass-morphism base" },
];

const ThemePreview = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  const copyCurrentTheme = () => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    
    let cssOutput = ":root {\n";
    colorTokens.forEach(token => {
      const value = styles.getPropertyValue(token.variable).trim();
      cssOutput += `  ${token.variable}: ${value};\n`;
    });
    cssOutput += "}";
    
    navigator.clipboard.writeText(cssOutput);
    toast.success("Current theme CSS copied to clipboard!");
  };

  const applyTestColor = (variable: string, hsl: string) => {
    document.documentElement.style.setProperty(variable, hsl);
    toast.info(`Testing: ${variable} = ${hsl}`);
  };

  const resetTheme = () => {
    colorTokens.forEach(token => {
      document.documentElement.style.removeProperty(token.variable);
    });
    toast.success("Theme reset to defaults");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card-bordered p-4 mb-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Theme Preview</h1>
            <Badge variant="outline" className="text-accent border-accent">
              Dev Tool
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCurrentTheme}>
              <Copy className="h-4 w-4 mr-2" />
              Copy CSS
            </Button>
            <Button variant="destructive" size="sm" onClick={resetTheme}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Color Tokens Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Color Tokens</CardTitle>
                <CardDescription>Click to test different values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {colorTokens.map((token) => (
                  <div key={token.variable} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{token.name}</span>
                      <code className="text-xs text-muted-foreground">{token.variable}</code>
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: `hsl(var(${token.variable}))` }}
                      />
                      <Input 
                        placeholder="270 70% 50%"
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyTestColor(token.variable, e.currentTarget.value);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{token.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Palette Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    applyTestColor("--primary", "180 100% 50%");
                    applyTestColor("--accent", "280 100% 60%");
                    applyTestColor("--neon-glow", "180 100% 50%");
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-400 mr-2" />
                  Cyber Cyan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    applyTestColor("--primary", "145 100% 45%");
                    applyTestColor("--accent", "280 100% 60%");
                    applyTestColor("--neon-glow", "145 100% 50%");
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-400 mr-2" />
                  Matrix Green
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    applyTestColor("--primary", "35 100% 55%");
                    applyTestColor("--accent", "15 100% 55%");
                    applyTestColor("--neon-glow", "35 100% 55%");
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-orange-400 mr-2" />
                  Sunset Gold
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    applyTestColor("--primary", "200 100% 50%");
                    applyTestColor("--accent", "330 100% 60%");
                    applyTestColor("--neon-glow", "200 100% 50%");
                    applyTestColor("--electric-blue", "200 100% 60%");
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-sky-400 mr-2" />
                  Electric Blue
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Components */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section Preview */}
            <Card className="overflow-hidden">
              <div className="gradient-primary p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to JumTunes</h2>
                <p className="text-white/80 mb-4">Own the music you love</p>
                <div className="flex justify-center gap-3">
                  <Button className="neon-glow">Get Started</Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="glass-card-bordered">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">1,234</p>
                      <p className="text-sm text-muted-foreground">Total Tracks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card-bordered">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">5.2K</p>
                      <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card-bordered">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">$890</p>
                      <p className="text-sm text-muted-foreground">Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Buttons & Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons & Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge className="bg-accent text-accent-foreground">Accent</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Track Card Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Track Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="glass-card-bordered p-4 flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Music className="h-8 w-8 text-white" />
                    </div>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Play className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">Midnight Dreams</h3>
                    <p className="text-sm text-muted-foreground">Aurora Beats</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="neon-glow-subtle">
                      <Download className="h-4 w-4 mr-1" />
                      $0.99
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Player</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="glass-card-bordered p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-primary/20">JT</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">Electric Nights</p>
                      <p className="text-sm text-muted-foreground">Neon Pulse</p>
                    </div>
                    <Button 
                      size="icon" 
                      className="rounded-full neon-glow"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-1" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1:23</span>
                      <span>3:45</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Tabs</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tracks">
                  <TabsList className="w-full">
                    <TabsTrigger value="tracks" className="flex-1">Tracks</TabsTrigger>
                    <TabsTrigger value="albums" className="flex-1">Albums</TabsTrigger>
                    <TabsTrigger value="playlists" className="flex-1">Playlists</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tracks" className="mt-4">
                    <p className="text-muted-foreground">Track content would appear here...</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Gradient Text */}
            <Card>
              <CardHeader>
                <CardTitle>Text Gradients & Effects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gradient text-3xl font-bold">Primary to Accent Gradient</p>
                <p className="text-gradient-blue text-3xl font-bold">Electric Blue Gradient</p>
                <div className="p-4 gradient-accent rounded-lg">
                  <p className="text-white font-semibold">Accent Gradient Background</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;
