import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Music, Disc3, Users, Building2, Headphones, Zap, Shield, Upload, LayoutDashboard, Library, Sparkles, UserPlus, UserMinus, Loader2, Play, Clock, History, ListPlus, Lock, TrendingUp, Rocket, Crown, Star, BadgeCheck, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { DownloadButton } from "@/components/download/DownloadButton";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { KaraokePromoBanner } from "@/components/home/KaraokePromoBanner";
import { FeaturedHeroCarousel } from "@/components/home/FeaturedHeroCarousel";
import { PWAInstallBanner } from "@/components/home/PWAInstallBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { useFollow } from "@/hooks/useFollows";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useNewReleases } from "@/hooks/useNewReleases";
import { useAdminHomeSettings } from "@/hooks/useAdminHomeSettings";
import { SpotifyEmbedSection } from "@/components/home/SpotifyEmbedSection";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatCompactNumber } from "@/lib/formatters";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useState, useEffect } from "react";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { useFeaturedArtists, useFeaturedLabels, useFeaturedTracks } from "@/hooks/useFeaturedContent";
const features = [{
  icon: Sparkles,
  title: "AI Release Packaging",
  description: "Upload your AI track — we generate cover art, descriptions, genre tags, and a full release page."
}, {
  icon: Disc3,
  title: "Artist Branding",
  description: "Build a real artist identity with AI-generated avatars, bios, and a consistent visual style."
}, {
  icon: Users,
  title: "Superfan Monetization",
  description: "Sell beats, merch, exclusive drops, and build direct fan relationships with built-in commerce."
}, {
  icon: Zap,
  title: "Prompt Ecosystem",
  description: "Publish, remix, and sell the prompts behind your tracks. Version chains create discovery networks."
}];

// Featured Artists Section Component - Banner style with carousel
function FeaturedArtistsSection() {
  const {
    data: featuredArtists,
    isLoading
  } = useFeaturedArtists("home_hero");
  const [currentIndex, setCurrentIndex] = useState(0);



  // Auto-rotate carousel when more than 1 artist
  useEffect(() => {
    if (!featuredArtists || featuredArtists.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredArtists.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredArtists]);
  if (isLoading) {
    return <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>;
  }
  if (!featuredArtists || featuredArtists.length === 0) {
    return null;
  }
  const currentArtist = featuredArtists[currentIndex];
  const showCarouselControls = featuredArtists.length > 1;
  
  return <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden glass-card-bordered p-6 md:p-10">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-muted/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-muted/20 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
          
          {/* Floating decoration */}
          <div className="absolute top-6 right-10 opacity-20">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="absolute bottom-6 left-10 opacity-15">
            <Music className="w-8 h-8 text-primary animate-bounce" style={{
            animationDuration: "3s"
          }} />
          </div>
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Artists</h2>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <Link to="/artists">View All</Link>
            </Button>
          </div>
          
          {/* Artist Content */}
          <div className="relative z-10">
            <Link to={`/artist/${currentArtist.content_id}`} className="flex flex-col md:flex-row items-center gap-6 md:gap-10 group">
              {/* Artist Avatar */}
              <div className="shrink-0 relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-muted/50 overflow-hidden border-4 border-accent/30 shadow-lg shadow-accent/20 group-hover:scale-105 group-hover:border-accent/60 transition-all duration-300">
                  {currentArtist.profile?.avatar_url ? <img src={currentArtist.profile.avatar_url} alt={currentArtist.profile.display_name || "Artist"} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>}
                </div>
                {currentArtist.profile?.is_verified && <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                    <BadgeCheck className="w-5 h-5 text-primary-foreground" />
                  </div>}
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
                {currentArtist.profile?.bio && <p className="text-muted-foreground max-w-xl line-clamp-2 mb-4">
                    {currentArtist.profile.bio}
                  </p>}
                

                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300" onClick={e => e.stopPropagation()}>
                    <Users className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Carousel Controls */}
          {showCarouselControls && <div className="relative z-10 flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setCurrentIndex(prev => (prev - 1 + featuredArtists.length) % featuredArtists.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Previous artist">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {featuredArtists.map((_, idx) => <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-accent w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} aria-label={`Go to artist ${idx + 1}`} />)}
              </div>
              <button onClick={() => setCurrentIndex(prev => (prev + 1) % featuredArtists.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Next artist">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>}
        </div>
        
        {/* Mobile View All Button */}
        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/artists">View All Artists</Link>
          </Button>
        </div>
      </div>
    </section>;
}

// Featured Labels Section Component - Banner style with carousel
function FeaturedLabelsSection() {
  const {
    data: featuredLabels,
    isLoading
  } = useFeaturedLabels("home_hero");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [labelStats, setLabelStats] = useState<Record<string, {
    trackCount: number;
    artistCount: number;
    followerCount: number;
  }>>({});

  // Fetch stats for all featured labels
  useEffect(() => {
    if (!featuredLabels || featuredLabels.length === 0) return;
    const fetchStats = async () => {
      const {
        supabase
      } = await import("@/integrations/supabase/client");
      const stats: Record<string, {
        trackCount: number;
        artistCount: number;
        followerCount: number;
      }> = {};
      await Promise.all(featuredLabels.map(async label => {
        const [tracksResult, artistsResult, followersResult] = await Promise.all([supabase.from("tracks").select("id", {
          count: "exact",
          head: true
        }).eq("label_id", label.content_id).eq("is_draft", false), supabase.from("label_roster").select("id", {
          count: "exact",
          head: true
        }).eq("label_id", label.content_id).eq("status", "active"), supabase.from("follows").select("id", {
          count: "exact",
          head: true
        }).eq("following_id", label.content_id)]);
        stats[label.content_id] = {
          trackCount: tracksResult.count || 0,
          artistCount: artistsResult.count || 0,
          followerCount: followersResult.count || 0
        };
      }));
      setLabelStats(stats);
    };
    fetchStats();
  }, [featuredLabels]);

  // Auto-rotate carousel when more than 1 label
  useEffect(() => {
    if (!featuredLabels || featuredLabels.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredLabels.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredLabels]);
  if (isLoading) {
    return <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        </div>
      </section>;
  }
  if (!featuredLabels || featuredLabels.length === 0) {
    return null;
  }
  const currentLabel = featuredLabels[currentIndex];
  const showCarouselControls = featuredLabels.length > 1;
  const currentStats = labelStats[currentLabel.content_id];
  return <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden glass-card-bordered p-6 md:p-10">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-muted/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-muted/20 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
          
          {/* Floating decoration */}
          <div className="absolute top-6 right-10 opacity-20">
            <Sparkles className="w-10 h-10 text-secondary animate-pulse" />
          </div>
          <div className="absolute bottom-6 left-10 opacity-15">
            <Building2 className="w-8 h-8 text-primary animate-bounce" style={{
            animationDuration: "3s"
          }} />
          </div>
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/40">
                <Crown className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Labels</h2>
                <p className="text-sm text-muted-foreground">Top labels powering the music scene</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <Link to="/labels">View All</Link>
            </Button>
          </div>
          
          {/* Label Content */}
          <div className="relative z-10">
            <Link to={`/label/${currentLabel.content_id}`} className="flex flex-col md:flex-row items-center gap-6 md:gap-10 group">
              {/* Label Avatar */}
              <div className="shrink-0 relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-muted/50 overflow-hidden border-4 border-secondary/30 shadow-lg shadow-secondary/20 group-hover:scale-105 group-hover:border-secondary/60 transition-all duration-300">
                  {currentLabel.profile?.avatar_url ? <img src={currentLabel.profile.avatar_url} alt={currentLabel.profile.display_name || "Label"} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    </div>}
                </div>
                {currentLabel.profile?.is_verified && <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-1.5 shadow-lg">
                    <BadgeCheck className="w-5 h-5 text-secondary-foreground" />
                  </div>}
              </div>
              
              {/* Label Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium mb-3">
                  <Crown className="w-3 h-3" />
                  Featured Label
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                  {currentLabel.profile?.display_name || "Unknown Label"}
                </h3>
                {currentLabel.profile?.bio && <p className="text-muted-foreground max-w-xl line-clamp-2 mb-4">
                    {currentLabel.profile.bio}
                  </p>}
                
                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Music className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCompactNumber(currentStats?.trackCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCompactNumber(currentStats?.artistCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Artists</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCompactNumber(currentStats?.followerCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 transition-all duration-300" onClick={e => e.stopPropagation()}>
                    <Building2 className="w-4 h-4 mr-2" />
                    View Label
                  </Button>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Carousel Controls */}
          {showCarouselControls && <div className="relative z-10 flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setCurrentIndex(prev => (prev - 1 + featuredLabels.length) % featuredLabels.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Previous label">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {featuredLabels.map((_, idx) => <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-secondary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} aria-label={`Go to label ${idx + 1}`} />)}
              </div>
              <button onClick={() => setCurrentIndex(prev => (prev + 1) % featuredLabels.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Next label">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>}
        </div>
        
        {/* Mobile View All Button */}
        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/labels">View All Labels</Link>
          </Button>
        </div>
      </div>
    </section>;
}

// Featured Tracks Section Component - Banner style with carousel
function FeaturedTracksSection() {
  const {
    data: featuredTracks,
    isLoading
  } = useFeaturedTracks("home_hero");
  const [currentIndex, setCurrentIndex] = useState(0);



  // Auto-rotate carousel when more than 1 track
  useEffect(() => {
    if (!featuredTracks || featuredTracks.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredTracks.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredTracks]);
  if (isLoading) {
    return <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>;
  }
  if (!featuredTracks || featuredTracks.length === 0) {
    return null;
  }
  const currentTrack = featuredTracks[currentIndex];
  const showCarouselControls = featuredTracks.length > 1;
  
  return <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-md p-6 md:p-10">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-muted/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-muted/20 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
          
          {/* Floating decoration */}
          <div className="absolute top-6 right-10 opacity-20">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="absolute bottom-6 left-10 opacity-15">
            <Disc3 className="w-8 h-8 text-primary animate-spin" style={{
            animationDuration: "8s"
          }} />
          </div>
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Tracks</h2>
                <p className="text-sm text-muted-foreground">Curated hits you need to hear</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <Link to="/browse">View All</Link>
            </Button>
          </div>
          
          {/* Track Content */}
          <div className="relative z-10">
            <Link to={`/browse`} className="flex flex-col md:flex-row items-center gap-6 md:gap-10 group">
              {/* Track Cover */}
              <div className="shrink-0 relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-muted/50 overflow-hidden border-4 border-primary/30 shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:border-primary/60 transition-all duration-300">
                  {currentTrack.track?.cover_art_url ? <img src={currentTrack.track.cover_art_url} alt={currentTrack.track.title || "Track"} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Disc3 className="w-12 h-12 text-muted-foreground" />
                    </div>}
                </div>
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </div>
                </div>
              </div>
              
              {/* Track Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3">
                  <Star className="w-3 h-3" />
                  Featured Track
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {currentTrack.track?.title || "Unknown Track"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  by <span className="text-foreground font-medium">{currentTrack.track?.artist_name || "Unknown Artist"}</span>
                </p>
                


                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300" onClick={e => e.stopPropagation()}>
                    <Play className="w-4 h-4 mr-2" />
                    Listen Now
                  </Button>
                  {currentTrack.track?.has_karaoke && <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10" onClick={e => e.stopPropagation()}>
                      <Headphones className="w-4 h-4 mr-2" />
                      Karaoke
                    </Button>}
                </div>
              </div>
            </Link>
          </div>
          
          {/* Carousel Controls */}
          {showCarouselControls && <div className="relative z-10 flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setCurrentIndex(prev => (prev - 1 + featuredTracks.length) % featuredTracks.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Previous track">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {featuredTracks.map((_, idx) => <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} aria-label={`Go to track ${idx + 1}`} />)}
              </div>
              <button onClick={() => setCurrentIndex(prev => (prev + 1) % featuredTracks.length)} className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors" aria-label="Next track">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>}
        </div>
        
        {/* Mobile View All Button */}
        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/browse">Browse All Tracks</Link>
          </Button>
        </div>
      </div>
    </section>;
}
export default function Index() {
  const {
    user,
    role,
    profile,
    isLoading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    data: adminSettings
  } = useAdminHomeSettings();
  const {
    data: pinnedDiscoverArtists
  } = useFeaturedArtists("home_discover_artists");
  const {
    data: recommendedArtists,
    isLoading: recommendationsLoading
  } = useRecommendedArtists(adminSettings?.discover_artists_limit ?? 6);
  const {
    data: newReleases,
    isLoading: newReleasesLoading
  } = useNewReleases(adminSettings?.new_releases_limit ?? 6, adminSettings?.new_releases_lookback_days ?? 7);
  const {
    recentlyPlayed
  } = useRecentlyPlayed(6);
  const {
    isFollowing,
    toggleFollow
  } = useFollow();
  const {
    showFeedback
  } = useFeedbackSafe();
  const {
    playTrack,
    addToQueue
  } = useAudioPlayer();
  const {
    canUseFeature
  } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Onboarding tour for fans
  const {
    showTour,
    setShowTour,
    completeTour,
    triggerTourForNewUser
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
  const needsOnboardingRedirect = !authLoading && user && profile !== null && (role === "artist" || role === "label") && !profile.onboarding_completed;
  if (authLoading || isCheckingOnboarding || needsOnboardingRedirect) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>;
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
        message: "Please sign in to follow artists"
      });
      return;
    }
    try {
      const result = await toggleFollow(artistId, artistName);
      showFeedback({
        type: "success",
        title: result.action === "followed" ? "Following" : "Unfollowed",
        message: result.artistName || "Artist",
        autoCloseDelay: 2000
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update follow status"
      });
    }
  };

  // Determine hero content based on auth state and role
  const getHeroContent = () => {
    if (!user) {
      // Not logged in - show motivating marketing
      return {
        badge: {
          text: "Built for the Superfans Behind the Streams",
          icon: TrendingUp
        },
        heading: <>
            <span className="text-foreground">Where Superfans</span>
            <br />
            <span className="text-gradient">Go Deeper.</span>
          </>,
        subheading: "Streaming helps artists get discovered. JumTunes helps artists build direct relationships, exclusive drops, and real fan support.",
        supportingLine: "This is your VIP room — the place where your biggest supporters show up first.",
        ctas: <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/auth?mode=signup">
                <Rocket className="w-5 h-5 mr-2" />
                Launch Your VIP Drop
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/browse">
                <Music className="w-5 h-5 mr-2" />
                Explore Exclusive Releases
              </Link>
            </Button>
          </>
      };
    }
    const displayName = profile?.display_name || "there";
    if (role === "fan") {
      return {
        badge: {
          text: "Your Collection Awaits",
          icon: Library
        },
        heading: <>
            <span className="text-foreground">Discover Your</span>
            <br />
            <span className="text-gradient">Next Favorite.</span>
          </>,
        subheading: "Own the music you love. Support the artists you believe in. Build a collection that's truly yours.",
        ctas: <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/browse">
                <Headphones className="w-5 h-5 mr-2" />
                Discover Music
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
            <Link to="/library">
                <Library className="w-5 h-5 mr-2" />
                My Library
              </Link>
            </Button>
          </>
      };
    }
    if (role === "artist") {
      return {
        badge: {
          text: "Artist Studio",
          icon: Sparkles
        },
        heading: <>
            <span className="text-foreground">Your Fans Are</span>
            <br />
            <span className="text-gradient">Waiting.</span>
          </>,
        subheading: `Share your sound, ${displayName}. Earn directly from your collectors and grow your fanbase.`,
        ctas: <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload Track
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/artist/dashboard">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </Button>
          </>
      };
    }
    if (role === "label") {
      return {
        badge: {
          text: "Label Command Center",
          icon: Crown
        },
        heading: <>
            <span className="text-foreground">Build Your</span>
            <br />
            <span className="text-gradient">Empire.</span>
          </>,
        subheading: `Empower your roster, ${displayName}. Manage releases, track performance, and scale your label.`,
        ctas: <>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload for Artist
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-glass-border hover:bg-glass hover:border-primary/50 transition-all duration-300 text-lg px-8" asChild>
              <Link to="/label/dashboard">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Label Dashboard
              </Link>
            </Button>
          </>
      };
    }

    // Fallback
    return {
      badge: {
        text: "Welcome to JumTunes",
        icon: Music
      },
      heading: <>
          <span className="text-foreground">Where Music</span>
          <br />
          <span className="text-gradient">Meets Ownership.</span>
        </>,
      subheading: "Discover exclusive tracks, support your favorite artists, and build a music collection that's truly yours.",
      ctas: <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
          <Link to="/browse">
            <Music className="w-5 h-5 mr-2" />
            Browse Music
          </Link>
        </Button>
    };
  };
  const heroContent = getHeroContent();
  return <Layout>
      <div className="animate-fade-in">
      {/* Hero Section - Split Layout */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden py-6 md:py-0 my-0">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden mx-0 my-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px] animate-pulse-glow" style={{
            animationDelay: "1s"
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[200px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-0">
            {/* Left Side - Motivational Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Small Logo */}
              

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
              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-xl mx-auto lg:mx-0">
                {heroContent.subheading}
              </p>

              {/* Supporting Line */}
              {'supportingLine' in heroContent && heroContent.supportingLine && (
                <p className="text-sm text-muted-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0 italic">
                  {heroContent.supportingLine as string}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {heroContent.ctas}
              </div>

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

      {/* Featured Tracks Section */}
      <FeaturedTracksSection />


      {/* Featured Labels Section */}
      <FeaturedLabelsSection />

      {/* Spotify Embed Section */}
      {adminSettings?.spotify_embed_uri && <SpotifyEmbedSection uri={adminSettings.spotify_embed_uri} />}

      {/* Discover Section - Only show for authenticated users */}
      {user && (adminSettings?.discover_artists_enabled !== false) && ((recommendedArtists && recommendedArtists.length > 0) || (pinnedDiscoverArtists && pinnedDiscoverArtists.length > 0)) && <section className="py-10 md:py-14 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Discover Artists
                </h2>
                <p className="text-muted-foreground mt-2">Artists you might like based on who you follow</p>
              </div>
              <Button variant="outline" className="hidden md:flex" asChild>
                <Link to="/artists">View All</Link>
              </Button>
            </div>

            {recommendationsLoading ? <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Pinned discover artists */}
                {pinnedDiscoverArtists?.map(pa => {
                  if (!pa.profile) return null;
                  const following = isFollowing(pa.content_id);
                  return <div key={`pinned-${pa.content_id}`} className="glass-card-bordered p-4 text-center group hover:bg-primary/10 transition-all duration-300 ring-1 ring-accent/20">
                    <Link to={`/artist/${pa.content_id}`}>
                      <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                        {pa.profile.avatar_url ? <img src={pa.profile.avatar_url} alt={pa.profile.display_name || "Artist"} className="w-full h-full object-cover" /> : <Music className="w-8 h-8 text-muted-foreground" />}
                      </div>
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {pa.profile.display_name || "Unknown"}
                      </h3>
                    </Link>
                    <Button size="sm" variant={following ? "outline" : "default"} className={`mt-3 w-full ${following ? "border-glass-border" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} onClick={() => handleFollow(pa.content_id, pa.profile?.display_name || "Artist")}>
                      {following ? <><UserMinus className="w-3 h-3 mr-1" />Following</> : <><UserPlus className="w-3 h-3 mr-1" />Follow</>}
                    </Button>
                  </div>;
                })}
                {/* Recommended artists (excluding pinned) */}
                {(recommendedArtists || []).filter(a => !pinnedDiscoverArtists?.some(pa => pa.content_id === a.id)).map(artist => {
              const following = isFollowing(artist.id);
              return <div key={artist.id} className="glass-card-bordered p-4 text-center group hover:bg-primary/10 transition-all duration-300">
                      <Link to={`/artist/${artist.id}`}>
                        <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                          {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.display_name || "Artist"} className="w-full h-full object-cover" /> : <Music className="w-8 h-8 text-muted-foreground" />}
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
                      {artist.matchingGenres.length > 0 && <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {artist.matchingGenres.slice(0, 2).map(genre => <span key={genre} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              {genre}
                            </span>)}
                        </div>}
                      <Button size="sm" variant={following ? "outline" : "default"} className={`mt-3 w-full ${following ? "border-glass-border" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} onClick={() => handleFollow(artist.id, artist.display_name || "Artist")}>
                        {following ? <>
                            <UserMinus className="w-3 h-3 mr-1" />
                            Following
                          </> : <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Follow
                          </>}
                      </Button>
                    </div>;
            })}
              </div>}

            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link to="/artists">Discover More Artists</Link>
              </Button>
            </div>
          </div>
        </section>}

      {/* Recently Played Section - Only for logged-in users with history */}
      {user && recentlyPlayed.length > 0 && <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <History className="w-5 h-5 text-secondary" />
                  Recently Played
                </h2>
                <p className="text-muted-foreground mt-2">Pick up where you left off</p>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {recentlyPlayed.map(track => <div key={track.id} className="glass-card-bordered p-2 group cursor-pointer hover:bg-secondary/10 transition-all duration-300" onClick={() => playTrack({
              id: track.id,
              title: track.title,
              audio_url: "",
              cover_art_url: track.cover_art_url,
              artist: {
                id: track.artist_id,
                display_name: track.artist_name
              }
            })}>
                  <div className="aspect-square rounded-md bg-muted/50 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                    {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" /> : <Disc3 className="w-8 h-8 text-muted-foreground" />}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={e => {
                    e.stopPropagation();
                    playTrack({
                      id: track.id,
                      title: track.title,
                      audio_url: "",
                      cover_art_url: track.cover_art_url,
                      artist: {
                        id: track.artist_id,
                        display_name: track.artist_name
                      }
                    });
                  }} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Play className="w-4 h-4 text-secondary-foreground ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-secondary transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {track.artist_name || "Unknown Artist"}
                  </p>
                </div>)}
            </div>
          </div>
        </section>}


      {/* Features Section - Only show for guests */}
      {!user && <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-foreground">Why Artists Use </span>
                <span className="text-gradient">JumTunes</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built to complement streaming — not compete with it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
              const Icon = feature.icon;
              return <div key={index} className="glass-card-bordered p-6 group hover:bg-primary/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>;
            })}
            </div>
          </div>
        </section>}

      {/* Brand Statement Section - Only show for guests */}
      {!user && <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="glass-card-bordered p-8 md:p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                The VIP Room Inside the Streaming Club.
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>Streaming is discovery.<br /><span className="text-foreground font-medium">JumTunes is connection.</span></p>
                <p>Streaming is reach.<br /><span className="text-foreground font-medium">JumTunes is loyalty.</span></p>
                <p>Streaming is exposure.<br /><span className="text-foreground font-medium">JumTunes is ownership.</span></p>
              </div>
            </div>
          </div>
        </section>}

      {/* Role CTA Section - Only show for guests */}
      {!user && <section className="py-10 md:py-14 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
                Turn listeners into super fans.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Fan Card */}
              <div className="glass-card-bordered p-8 text-center group hover:bg-secondary/10 transition-all duration-300">
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
              <div className="glass-card-bordered p-8 text-center group hover:bg-primary/10 transition-all duration-300">
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
              <div className="glass-card-bordered p-8 text-center group hover:bg-accent/10 transition-all duration-300">
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

            <div className="text-center mt-12">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 text-lg px-8" asChild>
                <Link to="/auth?mode=signup">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Your Exclusive Drop
                </Link>
              </Button>
            </div>
          </div>
        </section>}

      {/* New Releases Section */}
      {(adminSettings?.new_releases_enabled !== false) && newReleases && newReleases.length > 0 && <section className="py-10 md:py-14 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  New Releases
                </h2>
                <p className="text-muted-foreground mt-2">Fresh tracks from the last {adminSettings?.new_releases_lookback_days ?? 7} days</p>
              </div>
              <Button variant="outline" className="hidden md:flex" asChild>
                <Link to="/browse">View All</Link>
              </Button>
            </div>

            {newReleasesLoading ? <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {newReleases.map(track => <div key={track.id} className="glass-card-bordered p-2 group cursor-pointer hover:bg-primary/10 transition-all duration-300" onClick={() => playTrack({
              id: track.id,
              title: track.title,
              audio_url: track.audio_url,
              cover_art_url: track.cover_art_url,
              artist: {
                id: track.artist_id,
                display_name: track.artist_name
              }
            })}>
                    <div className="aspect-square rounded-md bg-muted/50 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                      {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" /> : <Disc3 className="w-8 h-8 text-muted-foreground" />}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button onClick={e => {
                    e.stopPropagation();
                    playTrack({
                      id: track.id,
                      title: track.title,
                      audio_url: track.audio_url,
                      cover_art_url: track.cover_art_url,
                      artist: {
                        id: track.artist_id,
                        display_name: track.artist_name
                      }
                    });
                  }} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                        </button>
                      </div>
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-primary/90 text-[10px] font-medium text-primary-foreground">
                        NEW
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {track.artist_name || "Unknown Artist"}
                    </p>
                    <div className="text-[10px] text-primary font-semibold mt-0.5">
                      ${track.price.toFixed(2)}
                    </div>
                  </div>)}
              </div>}

            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link to="/browse">View All Tracks</Link>
              </Button>
            </div>
          </div>
        </section>}

      {/* Trending Section - Now a Carousel */}
      {(adminSettings?.trending_enabled !== false) && <TrendingCarousel onAddToQueue={handleAddToQueue} limit={adminSettings?.trending_limit ?? 12} />}

      {/* Spotify Embed Section - moved to after featured sections */}

      {/* Karaoke Promo Banner */}
      <KaraokePromoBanner />
      </div>
      <PremiumFeatureModal open={showPremiumModal} onOpenChange={setShowPremiumModal} feature="Add to Queue" />

      {/* Onboarding Tour for Fans */}
      {user && role === "fan" && <OnboardingTour open={showTour} onOpenChange={setShowTour} role="fan" onComplete={completeTour} />}

      {/* PWA Install Banner for mobile users */}
      <PWAInstallBanner />
    </Layout>;
}