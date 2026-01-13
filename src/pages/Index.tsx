import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, Disc3, Users, Building2, Headphones, Zap, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    icon: Disc3,
    title: "Own Your Music",
    description: "Collect exclusive tracks and own them forever. Your music, your collection.",
  },
  {
    icon: Users,
    title: "Support Artists",
    description: "Connect directly with artists and support their creative journey.",
  },
  {
    icon: Building2,
    title: "Label Management",
    description: "Labels can manage rosters and release music on behalf of their artists.",
  },
  {
    icon: Shield,
    title: "Secure & Transparent",
    description: "Every transaction is secure and ownership is verifiable.",
  },
];

const stats = [
  { value: "50K+", label: "Tracks" },
  { value: "10K+", label: "Artists" },
  { value: "500K+", label: "Collectors" },
  { value: "$2M+", label: "Artist Earnings" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[200px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-float">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">The Future of Music Ownership</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Collect Music.</span>
              <br />
              <span className="text-gradient">Own the Experience.</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              JumTunes is where fans become collectors. Discover exclusive tracks, support your favorite artists, and build a music collection that's truly yours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
                asChild
              >
                <Link to="/auth?mode=signup">
                  <Headphones className="w-5 h-5 mr-2" />
                  Start Collecting
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8"
                asChild
              >
                <Link to="/browse">
                  <Music className="w-5 h-5 mr-2" />
                  Browse Music
                </Link>
              </Button>
            </div>

            {/* Animated Music Icon */}
            <div className="mt-16 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center animate-float neon-glow">
                  <Disc3 className="w-16 h-16 text-foreground animate-spin" style={{ animationDuration: "8s" }} />
                </div>
                <div className="absolute -inset-4 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Why </span>
              <span className="text-gradient">JumTunes?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A new era of music ownership where fans, artists, and labels thrive together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="glass-card p-6 group hover:bg-primary/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role CTA Section */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
              Join the Revolution
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you're a fan, artist, or label – there's a place for you on JumTunes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Fan Card */}
            <div className="glass-card p-8 text-center group hover:bg-secondary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Headphones className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">For Fans</h3>
              <p className="text-muted-foreground mb-6">
                Discover, collect, and own exclusive music from artists you love.
              </p>
              <Button variant="outline" className="border-secondary/50 hover:bg-secondary/10" asChild>
                <Link to="/auth?mode=signup&role=fan">Join as Fan</Link>
              </Button>
            </div>

            {/* Artist Card */}
            <div className="glass-card p-8 text-center group hover:bg-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">For Artists</h3>
              <p className="text-muted-foreground mb-6">
                Upload your music, connect with fans, and earn directly from your art.
              </p>
              <Button className="gradient-accent" asChild>
                <Link to="/auth?mode=signup&role=artist">Join as Artist</Link>
              </Button>
            </div>

            {/* Label Card */}
            <div className="glass-card p-8 text-center group hover:bg-accent/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">For Labels</h3>
              <p className="text-muted-foreground mb-6">
                Manage your artist roster and release music on their behalf.
              </p>
              <Button variant="outline" className="border-accent/50 hover:bg-accent/10" asChild>
                <Link to="/auth?mode=signup&role=label">Join as Label</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section Placeholder */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-accent" />
                Trending Now
              </h2>
              <p className="text-muted-foreground mt-2">The hottest tracks on JumTunes right now</p>
            </div>
            <Button variant="outline" className="hidden md:flex" asChild>
              <Link to="/browse">View All</Link>
            </Button>
          </div>

          {/* Placeholder for trending tracks */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Disc3 className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="h-4 bg-muted/50 rounded mb-2" />
                <div className="h-3 bg-muted/30 rounded w-2/3" />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/browse">View All Tracks</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
