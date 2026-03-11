import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Music, Disc3, Users, Building2, Headphones, Zap, Shield, Upload, LayoutDashboard, Library, Sparkles, Loader2, Play, Rocket, Crown, Star, Mic2, Globe } from "lucide-react";
import featureAiCreation from "@/assets/feature-ai-creation.jpg";
import featureKaraoke from "@/assets/feature-karaoke.jpg";
import featureGalaxy from "@/assets/feature-galaxy.jpg";
import featureCommunity from "@/assets/feature-community.jpg";
import featureGalaxyCta from "@/assets/feature-galaxy-cta.jpg";
import featureCta from "@/assets/feature-cta.jpg";
import { FeaturedHeroCarousel } from "@/components/home/FeaturedHeroCarousel";
import { PWAInstallBanner } from "@/components/home/PWAInstallBanner";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { CreateWithAISection } from "@/components/home/CreateWithAISection";
import { FanZoneSection } from "@/components/home/FanZoneSection";
import { AIDJSection } from "@/components/home/AIDJSection";
import { MusicGalaxy } from "@/components/home/MusicGalaxy";
import { KaraokePromoBanner } from "@/components/home/KaraokePromoBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useState, useEffect } from "react";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";

export default function Index() {
  const { user, role, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showGalaxy, setShowGalaxy] = useState(false);

  // Onboarding tour for fans
  const { showTour, setShowTour, completeTour, triggerTourForNewUser } = useOnboardingTour(user?.id);

  // Check for tour trigger from auth callback
  useEffect(() => {
    if (searchParams.get("tour") === "1" && user && role === "fan") {
      triggerTourForNewUser();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, user, role, triggerTourForNewUser]);

  // Redirect Artists/Labels with incomplete onboarding to /onboarding
  useEffect(() => {
    if (!authLoading && user && profile !== null) {
      if ((role === "artist" || role === "label") && !profile.onboarding_completed) {
        navigate("/onboarding");
      }
    }
  }, [authLoading, user, role, profile, navigate]);

  const isCheckingOnboarding = !authLoading && user && profile === null;
  const needsOnboardingRedirect = !authLoading && user && profile !== null && (role === "artist" || role === "label") && !profile.onboarding_completed;
  
  if (authLoading || isCheckingOnboarding || needsOnboardingRedirect) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Music Galaxy fullscreen mode
  if (showGalaxy) {
    return <MusicGalaxy onClose={() => setShowGalaxy(false)} />;
  }

  // Hero content based on auth state
  const getHeroContent = () => {
    if (!user) {
      return {
        badge: { text: "The AI Music Interaction Platform", icon: Sparkles },
        heading: (
          <>
            <span className="text-foreground">Listen. Create.</span>
            <br />
            <span className="text-gradient">Interact.</span>
          </>
        ),
        subheading: "The first platform where you don't just listen to music — you remix it, sing along, explore it visually, and create with AI.",
        ctas: (
          <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/auth?mode=signup">
                <Rocket className="w-5 h-5 mr-2" />
                Start Creating
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/browse">
                <Music className="w-5 h-5 mr-2" />
                Explore Music
              </Link>
            </Button>
          </>
        ),
      };
    }
    const displayName = profile?.display_name || "there";
    if (role === "fan") {
      return {
        badge: { text: "Your Next Favorite Awaits", icon: Headphones },
        heading: (
          <>
            <span className="text-foreground">Discover.</span>
            <br />
            <span className="text-gradient">Create. Connect.</span>
          </>
        ),
        subheading: "Explore music, sing karaoke, remix with AI, and connect with artists.",
        ctas: (
          <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/browse"><Headphones className="w-5 h-5 mr-2" />Discover</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/library"><Library className="w-5 h-5 mr-2" />My Library</Link>
            </Button>
          </>
        ),
      };
    }
    if (role === "artist") {
      return {
        badge: { text: "Artist Studio", icon: Sparkles },
        heading: (
          <>
            <span className="text-foreground">Your Fans Are</span>
            <br />
            <span className="text-gradient">Waiting.</span>
          </>
        ),
        subheading: `Share your sound, ${displayName}. Earn directly from your fans.`,
        ctas: (
          <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/upload"><Upload className="w-5 h-5 mr-2" />Upload Track</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/artist/dashboard"><LayoutDashboard className="w-5 h-5 mr-2" />Dashboard</Link>
            </Button>
          </>
        ),
      };
    }
    if (role === "label") {
      return {
        badge: { text: "Label Command Center", icon: Crown },
        heading: (
          <>
            <span className="text-foreground">Build Your</span>
            <br />
            <span className="text-gradient">Empire.</span>
          </>
        ),
        subheading: `Empower your roster, ${displayName}. Manage releases and scale your label.`,
        ctas: (
          <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/upload"><Upload className="w-5 h-5 mr-2" />Upload</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/label/dashboard"><LayoutDashboard className="w-5 h-5 mr-2" />Dashboard</Link>
            </Button>
          </>
        ),
      };
    }
    return {
      badge: { text: "The AI Music Interaction Platform", icon: Sparkles },
      heading: (
        <>
          <span className="text-foreground">Where Music</span>
          <br />
          <span className="text-gradient">Comes Alive.</span>
        </>
      ),
      subheading: "Explore, create, and interact with music using AI.",
      ctas: (
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8" asChild>
          <Link to="/browse"><Music className="w-5 h-5 mr-2" />Browse Music</Link>
        </Button>
      ),
    };
  };

  const heroContent = getHeroContent();

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* ===== FEATURED TRACK HERO ===== */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden py-6 md:py-0">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left - Text */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                  <heroContent.badge.icon className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">{heroContent.badge.text}</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  {heroContent.heading}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  {heroContent.subheading}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {heroContent.ctas}
                </div>
              </div>

              {/* Right - Featured Track Carousel */}
              <div className="order-1 lg:order-2">
                <FeaturedHeroCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* ===== DISCOVER ===== */}
        <DiscoverSection />

        {/* ===== CREATE WITH AI ===== */}
        <CreateWithAISection />

        {/* ===== FAN ZONE ===== */}
        <FanZoneSection />

        {/* ===== AI DJ ===== */}
        <AIDJSection />

        {/* ===== MUSIC GALAXY TOGGLE ===== */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="glass-card-bordered p-8 md:p-12 relative overflow-hidden">
                {/* Background image */}
                <img src={featureGalaxyCta} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 animate-card-drift" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Music <span className="text-gradient">Galaxy</span>
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                    Explore songs as floating nodes in an interactive galaxy. Discover connections between tracks, genres, and artists.
                  </p>
                  <Button
                    size="lg"
                    className="gradient-accent neon-glow-subtle hover:scale-105 transition-all duration-300 text-lg px-8"
                    onClick={() => setShowGalaxy(true)}
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Explore Music Galaxy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== GUEST-ONLY SECTIONS ===== */}
        {!user && (
          <>
            {/* Features */}
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    <span className="text-foreground">Why Creators Choose </span>
                    <span className="text-gradient">JumTunes</span>
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    More than streaming. A creative playground powered by AI.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { icon: Sparkles, title: "AI Creation Suite", description: "Remix, generate covers, create lyrics, and produce videos with AI tools.", image: featureAiCreation },
                    { icon: Mic2, title: "Interactive Karaoke", description: "Sing along with AI-separated instrumentals and synchronized lyrics.", image: featureKaraoke },
                    { icon: Disc3, title: "Music Galaxy", description: "Explore music visually as connected nodes in an interactive galaxy view.", image: featureGalaxy },
                    { icon: Users, title: "Fan Community", description: "Share covers, duets, remixes, and compete in community challenges.", image: featureCommunity },
                  ].map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <div key={i} className="glass-card-bordered p-6 group hover:bg-primary/10 transition-all duration-300 relative overflow-hidden">
                        <img src={feature.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity duration-500 animate-card-drift" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-24 bg-card/20">
              <div className="container mx-auto px-4">
                <div className="glass-card-bordered p-8 md:p-16 text-center max-w-3xl mx-auto relative overflow-hidden">
                   <img src={featureCta} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 animate-card-drift" />
                   <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                      The Future of Music<br /><span className="text-gradient">Is Interactive.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                      Don't just listen. Create, remix, sing, explore, and connect with music like never before.
                    </p>
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
                      <Link to="/auth?mode=signup">
                        <Rocket className="w-5 h-5 mr-2" />
                        Join JumTunes
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Karaoke Promo */}
        <KaraokePromoBanner />
      </div>

      <PremiumFeatureModal open={showPremiumModal} onOpenChange={setShowPremiumModal} feature="Add to Queue" />
      {user && role === "fan" && <OnboardingTour open={showTour} onOpenChange={setShowTour} role="fan" onComplete={completeTour} />}
      <PWAInstallBanner />
    </Layout>
  );
}
