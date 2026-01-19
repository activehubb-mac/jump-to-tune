import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Music, Disc3, Users, Building2, Headphones, Zap, Shield, Upload, LayoutDashboard, Library, Sparkles, UserPlus, UserMinus, Loader2, Play, Clock, History, ListPlus, Lock, TrendingUp, Rocket, Crown, Star, BadgeCheck } from "lucide-react";
import { DownloadButton } from "@/components/download/DownloadButton";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { KaraokePromoBanner } from "@/components/home/KaraokePromoBanner";
import { FeaturedHeroCarousel } from "@/components/home/FeaturedHeroCarousel";
import { useAuth } from "@/contexts/AuthContext";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { useFollow } from "@/hooks/useFollows";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useNewReleases } from "@/hooks/useNewReleases";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatCompactNumber } from "@/lib/formatters";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useState, useEffect } from "react";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { useFeaturedArtists, useFeaturedLabels } from "@/hooks/useFeaturedContent";
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

// Featured Artists Section Component - Banner style with carousel
function FeaturedArtistsSection() {
  const { data: featuredArtists, isLoading } = useFeaturedArtists("home_hero");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate carousel when more than 1 artist
  useEffect(() => {
    if (!featuredArtists || featuredArtists.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArtists.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredArtists]);

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!featuredArtists || featuredArtists.length === 0) {
    return null;
  }

  const currentArtist = featuredArtists[currentIndex];
  const showCarouselControls = featuredArtists.length > 1;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 p-6 md:p-10">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
          
          {/* Floating decoration */}
          <div className="absolute top-6 right-10 opacity-20">
            <Sparkles className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <div className="absolute bottom-6 left-10 opacity-15">
            <Music className="w-8 h-8 text-primary animate-bounce" style={{ animationDuration: "3s" }} />
          </div>
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Artists</h2>
                <p className="text-sm text-muted-foreground">Handpicked talent worth discovering</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <Link to="/artists">View All</Link>
            </Button>
          </div>
          
          {/* Artist Content */}
          <div className="relative z-10">
            <Link 
              to={`/artist/${currentArtist.content_id}`}
              className="flex flex-col md:flex-row items-center gap-6 md:gap-10 group"
            >
              {/* Artist Avatar */}
              <div className="shrink-0 relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-muted/50 overflow-hidden border-4 border-accent/30 shadow-lg shadow-accent/20 group-hover:scale-105 group-hover:border-accent/60 transition-all duration-300">
                  {currentArtist.profile?.avatar_url ? (
                    <img
                      src={currentArtist.profile.avatar_url}
                      alt={currentArtist.profile.display_name || "Artist"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {currentArtist.profile?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                    <BadgeCheck className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              {/* Artist Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium mb-3">
                  <Star className="w-3 h-3" />
                  Featured Artist
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {currentArtist.profile?.display_name || "Unknown Artist"}
                </h3>
                {currentArtist.profile?.bio && (
                  <p className="text-muted-foreground max-w-xl line-clamp-2 mb-4">
                    {currentArtist.profile.bio}
                  </p>
                )}
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Button 
                    className="gradient-accent neon-glow-subtle hover:scale-105 transition-all duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Carousel Indicators */}
          {showCarouselControls && (
            <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
              {featuredArtists.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex 
                      ? "bg-accent w-8" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to artist ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Mobile View All Button */}
        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/artists">View All Artists</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Featured Labels Section Component
function FeaturedLabelsSection() {
  const { data: featuredLabels, isLoading } = useFeaturedLabels("home_hero");

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!featuredLabels || featuredLabels.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-7 h-7 text-secondary" />
              Featured Labels
            </h2>
            <p className="text-muted-foreground mt-1">Top labels powering the music scene</p>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/labels">View All Labels</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredLabels.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              to={`/label/${item.content_id}`}
              className="glass-card p-6 group hover:bg-secondary/10 transition-all duration-300 flex items-center gap-4"
            >
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                  {item.profile?.avatar_url ? (
                    <img
                      src={item.profile.avatar_url}
                      alt={item.profile.display_name || "Label"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                {item.profile?.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-secondary rounded-full p-1">
                    <BadgeCheck className="w-3 h-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors">
                  {item.profile?.display_name || "Unknown Label"}
                </h3>
                {item.profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.profile.bio}
                  </p>
                )}
                <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/labels">View All Labels</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { user, role, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: recommendedArtists, isLoading: recommendationsLoading } = useRecommendedArtists(6);
  const { data: newReleases, isLoading: newReleasesLoading } = useNewReleases(6);
  const { recentlyPlayed } = useRecentlyPlayed(6);
  const { isFollowing, toggleFollow } = useFollow();
  const { showFeedback } = useFeedbackSafe();
  const { playTrack, addToQueue } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Onboarding tour for fans
  const {
    showTour,
    setShowTour,
    completeTour,
    triggerTourForNewUser,
  } = useOnboardingTour(user?.id);

  // Check for tour trigger from auth callback
  useEffect(() => {
    if (searchParams.get("tour") === "1" && user && role === "fan") {
      triggerTourForNewUser();
      // Clean up URL
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

  // Show loading spinner while checking onboarding status for Artists/Labels
  const isCheckingOnboarding = !authLoading && user && profile === null;
  const needsOnboardingRedirect = !authLoading && user && profile !== null && 
    (role === "artist" || role === "label") && !profile.onboarding_completed;

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

  const handleAddToQueue = (track: Parameters<typeof addToQueue>[0]) => {
    if (!canUseFeature("addToQueue")) {
      setShowPremiumModal(true);
      return;
    }
    addToQueue(track);
  };

  const handleFollow = async (artistId: string, artistName: string) => {
    if (!user) {
      showFeedback({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to follow artists",
      });
      return;
    }
    try {
      const result = await toggleFollow(artistId, artistName);
      showFeedback({
        type: "success",
        title: result.action === "followed" ? "Following" : "Unfollowed",
        message: result.artistName || "Artist",
        autoCloseDelay: 2000,
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update follow status",
      });
    }
  };

  // Determine hero content based on auth state and role
  const getHeroContent = () => {
    if (!user) {
      // Not logged in - show motivating marketing
      return {
        badge: { text: "Join 10K+ Creators", icon: TrendingUp },
        heading: (
          <>
            <span className="text-foreground">Where Artists</span>
            <br />
            <span className="text-gradient">Thrive.</span>
          </>
        ),
        subheading: "Your sound. Your earnings. Your legacy. Join thousands of artists building their future on JumTunes.",
        ctas: (
          <>
            <Button
              size="lg"
              className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/auth?mode=signup">
                <Rocket className="w-5 h-5 mr-2" />
                Start Creating
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
        badge: { text: "Your Collection Awaits", icon: Library },
        heading: (
          <>
            <span className="text-foreground">Discover Your</span>
            <br />
            <span className="text-gradient">Next Favorite.</span>
          </>
        ),
        subheading: "Own the music you love. Support the artists you believe in. Build a collection that's truly yours.",
        ctas: (
          <>
            <Button
              size="lg"
              className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/browse">
                <Headphones className="w-5 h-5 mr-2" />
                Discover Music
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/collection">
                <Library className="w-5 h-5 mr-2" />
                My Collection
              </Link>
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
        subheading: `Share your sound, ${displayName}. Earn directly from your collectors and grow your fanbase.`,
        ctas: (
          <>
            <Button
              size="lg"
              className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload Track
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/artist/dashboard">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
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
        subheading: `Empower your roster, ${displayName}. Manage releases, track performance, and scale your label.`,
        ctas: (
          <>
            <Button
              size="lg"
              className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload for Artist
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/label/dashboard">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Label Dashboard
              </Link>
            </Button>
          </>
        ),
      };
    }

    // Fallback
    return {
      badge: { text: "Welcome to JumTunes", icon: Music },
      heading: (
        <>
          <span className="text-foreground">Where Music</span>
          <br />
          <span className="text-gradient">Meets Ownership.</span>
        </>
      ),
      subheading: "Discover exclusive tracks, support your favorite artists, and build a music collection that's truly yours.",
      ctas: (
        <Button
          size="lg"
          className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
          asChild
        >
          <Link to="/browse">
            <Music className="w-5 h-5 mr-2" />
            Browse Music
          </Link>
        </Button>
      ),
    };
  };

  const heroContent = getHeroContent();

  return (
    <Layout>
      <div className="animate-fade-in">
      {/* Hero Section - Split Layout */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden py-12 md:py-0">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[200px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Motivational Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Small Logo */}
              <div className="flex justify-center lg:justify-start mb-6 relative">
                <div className="absolute inset-0 flex justify-center lg:justify-start items-center">
                  <div className="w-24 h-24 bg-primary/30 rounded-full blur-[60px]" />
                </div>
                <img 
                  src="/images/jumtunes-logo.png" 
                  alt="JumTunes" 
                  className="h-20 md:h-24 w-auto object-contain relative z-10"
                />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <heroContent.badge.icon className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-muted-foreground">{heroContent.badge.text}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {heroContent.heading}
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {heroContent.subheading}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {heroContent.ctas}
              </div>

              {/* Quick Stats for Guests */}
              {!user && (
                <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 pt-8 border-t border-glass-border">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-gradient">50K+</div>
                    <div className="text-xs text-muted-foreground">Tracks</div>
                  </div>
                  <div className="w-px h-8 bg-glass-border" />
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-gradient">10K+</div>
                    <div className="text-xs text-muted-foreground">Artists</div>
                  </div>
                  <div className="w-px h-8 bg-glass-border" />
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-gradient">$2M+</div>
                    <div className="text-xs text-muted-foreground">Earned</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Featured Content Carousel */}
            <div className="order-1 lg:order-2">
              <FeaturedHeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      <FeaturedArtistsSection />

      {/* Karaoke Promo Banner */}
      <KaraokePromoBanner />

      {/* Featured Labels Section */}
      <FeaturedLabelsSection />

      {/* Discover Section - Only show for authenticated users */}
      {user && recommendedArtists && recommendedArtists.length > 0 && (
        <section className="py-16 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-accent" />
                  Discover Artists
                </h2>
                <p className="text-muted-foreground mt-2">Artists you might like based on who you follow</p>
              </div>
              <Button variant="outline" className="hidden md:flex" asChild>
                <Link to="/artists">View All</Link>
              </Button>
            </div>

            {recommendationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recommendedArtists.map((artist) => {
                  const following = isFollowing(artist.id);
                  
                  return (
                    <div
                      key={artist.id}
                      className="glass-card p-4 text-center group hover:bg-primary/10 transition-all duration-300"
                    >
                      <Link to={`/artist/${artist.id}`}>
                        <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                          {artist.avatar_url ? (
                            <img
                              src={artist.avatar_url}
                              alt={artist.display_name || "Artist"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {artist.display_name || "Unknown"}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{artist.trackCount} tracks</span>
                        <span>•</span>
                        <span>{formatCompactNumber(artist.followerCount)} fans</span>
                      </div>
                      {artist.matchingGenres.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {artist.matchingGenres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={following ? "outline" : "default"}
                        className={`mt-3 w-full ${following ? "border-glass-border" : "gradient-accent"}`}
                        onClick={() => handleFollow(artist.id, artist.display_name || "Artist")}
                      >
                        {following ? (
                          <>
                            <UserMinus className="w-3 h-3 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link to="/artists">Discover More Artists</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Recently Played Section - Only for logged-in users with history */}
      {user && recentlyPlayed.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <History className="w-8 h-8 text-secondary" />
                  Recently Played
                </h2>
                <p className="text-muted-foreground mt-2">Pick up where you left off</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyPlayed.map((track) => (
                <div
                  key={track.id}
                  className="glass-card p-4 group cursor-pointer hover:bg-secondary/10 transition-all duration-300"
                  onClick={() => playTrack({
                    id: track.id,
                    title: track.title,
                    audio_url: "",
                    cover_art_url: track.cover_art_url,
                    artist: {
                      id: track.artist_id,
                      display_name: track.artist_name,
                    },
                  })}
                >
                  <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                    {track.cover_art_url ? (
                      <img
                        src={track.cover_art_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Disc3 className="w-12 h-12 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack({
                            id: track.id,
                            title: track.title,
                            audio_url: "",
                            cover_art_url: track.cover_art_url,
                            artist: { id: track.artist_id, display_name: track.artist_name },
                          });
                        }}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 text-secondary-foreground ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToQueue({
                            id: track.id,
                            title: track.title,
                            audio_url: "",
                            cover_art_url: track.cover_art_url,
                            artist: { id: track.artist_id, display_name: track.artist_name },
                          });
                        }}
                        className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
                        title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}
                      >
                        {canUseFeature("addToQueue") ? (
                          <ListPlus className="w-5 h-5 text-white" />
                        ) : (
                          <Lock className="w-4 h-4 text-white/70" />
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors">
                    {track.title}
                  </h3>
                  <Link
                    to={`/artist/${track.artist_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-muted-foreground hover:text-secondary transition-colors truncate block"
                  >
                    {track.artist_name || "Unknown Artist"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Only show for guests */}
      {!user && (
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
      )}

      {/* Features Section - Only show for guests */}
      {!user && (
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
      )}

      {/* Role CTA Section - Only show for guests */}
      {!user && (
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
                <Button variant="outline" className="hover:bg-secondary/10" asChild>
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
                <Button variant="outline" className="hover:bg-accent/10" asChild>
                  <Link to="/auth?mode=signup&role=label">Join as Label</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Releases Section */}
      {newReleases && newReleases.length > 0 && (
        <section className="py-24 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  New Releases
                </h2>
                <p className="text-muted-foreground mt-2">Fresh tracks from the last 7 days</p>
              </div>
              <Button variant="outline" className="hidden md:flex" asChild>
                <Link to="/browse">View All</Link>
              </Button>
            </div>

            {newReleasesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {newReleases.map((track) => (
                  <div
                    key={track.id}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() => playTrack({
                      id: track.id,
                      title: track.title,
                      audio_url: track.audio_url,
                      cover_art_url: track.cover_art_url,
                      artist: {
                        id: track.artist_id,
                        display_name: track.artist_name,
                      },
                    })}
                  >
                    <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                      {track.cover_art_url ? (
                        <img
                          src={track.cover_art_url}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc3 className="w-12 h-12 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack({
                              id: track.id,
                              title: track.title,
                              audio_url: track.audio_url,
                              cover_art_url: track.cover_art_url,
                              artist: { id: track.artist_id, display_name: track.artist_name },
                            });
                          }}
                          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue({
                              id: track.id,
                              title: track.title,
                              audio_url: track.audio_url,
                              cover_art_url: track.cover_art_url,
                              artist: { id: track.artist_id, display_name: track.artist_name },
                            });
                          }}
                          className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
                          title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}
                        >
                          {canUseFeature("addToQueue") ? (
                            <ListPlus className="w-5 h-5 text-white" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/70" />
                          )}
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DownloadButton
                            track={{
                              id: track.id,
                              title: track.title,
                              cover_art_url: track.cover_art_url,
                              price: track.price,
                              audio_url: track.audio_url,
                              artist: { display_name: track.artist_name },
                            }}
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-full border border-white/30 text-white hover:bg-white/10"
                          />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-xs font-medium text-primary-foreground">
                        NEW
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <Link
                      to={`/artist/${track.artist_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block"
                    >
                      {track.artist_name || "Unknown Artist"}
                    </Link>
                    <div className="text-xs text-accent font-medium mt-1">
                      ${track.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link to="/browse">View All Tracks</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section - Now a Carousel */}
      <TrendingCarousel onAddToQueue={handleAddToQueue} />
      </div>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />

      {/* Onboarding Tour for Fans */}
      {user && role === "fan" && (
        <OnboardingTour
          open={showTour}
          onOpenChange={setShowTour}
          role="fan"
          onComplete={completeTour}
        />
      )}
    </Layout>
  );
}
