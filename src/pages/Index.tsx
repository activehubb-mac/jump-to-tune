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
  icon: Disc3,
  title: "Own Your Music",
  description: "Collect exclusive tracks and own them forever. Your music, your collection."
}, {
  icon: Users,
  title: "Support Artists",
  description: "Connect directly with artists and support their creative journey."
}, {
  icon: Building2,
  title: "Label Management",
  description: "Labels can manage rosters and release music on behalf of their artists."
}, {
  icon: Shield,
  title: "Secure & Transparent",
  description: "Every transaction is secure and ownership is verifiable."
}];
const stats = [{
  value: "50K+",
  label: "Tracks"
}, {
  value: "10K+",
  label: "Artists"
}, {
  value: "500K+",
  label: "Collectors"
}, {
  value: "$2M+",
  label: "Artist Earnings"
}];

// Featured Artists Section Component - Banner style with carousel
function FeaturedArtistsSection() {
  const {
    data: featuredArtists,
    isLoading
  } = useFeaturedArtists("home_hero");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [artistStats, setArtistStats] = useState<Record<string, {
    trackCount: number;
    followerCount: number;
  }>>({});

  // Fetch stats for all featured artists
  useEffect(() => {
    if (!featuredArtists || featuredArtists.length === 0) return;
    const fetchStats = async () => {
      const {
        supabase
      } = await import("@/integrations/supabase/client");
      const stats: Record<string, {
        trackCount: number;
        followerCount: number;
      }> = {};
      await Promise.all(featuredArtists.map(async artist => {
        const [tracksResult, followersResult] = await Promise.all([supabase.from("tracks").select("id", {
          count: "exact",
          head: true
        }).eq("artist_id", artist.content_id).eq("is_draft", false), supabase.from("follows").select("id", {
          count: "exact",
          head: true
        }).eq("following_id", artist.content_id)]);
        stats[artist.content_id] = {
          trackCount: tracksResult.count || 0,
          followerCount: followersResult.count || 0
        };
      }));
      setArtistStats(stats);
    };
    fetchStats();
  }, [featuredArtists]);

  // Auto-rotate carousel when more than 1 artist
  useEffect(() => {
    if (!featuredArtists || featuredArtists.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredArtists.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredArtists]);
  if (isLoading) {
    return <section className="py-8">
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
  const currentStats = artistStats[currentArtist.content_id];
  return <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-6 md:p-10">
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
                        {formatCompactNumber(currentStats?.followerCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                  </div>
                </div>
                
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
    return <section className="py-8">
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
  return <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-6 md:p-10">
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
  const [trackStats, setTrackStats] = useState<Record<string, {
    likeCount: number;
    purchaseCount: number;
  }>>({});

  // Fetch stats for all featured tracks
  useEffect(() => {
    if (!featuredTracks || featuredTracks.length === 0) return;
    const fetchStats = async () => {
      const {
        supabase
      } = await import("@/integrations/supabase/client");
      const stats: Record<string, {
        likeCount: number;
        purchaseCount: number;
      }> = {};
      await Promise.all(featuredTracks.map(async track => {
        const [likesResult, purchasesResult] = await Promise.all([supabase.from("likes").select("id", {
          count: "exact",
          head: true
        }).eq("track_id", track.content_id), supabase.from("purchases").select("id", {
          count: "exact",
          head: true
        }).eq("track_id", track.content_id)]);
        stats[track.content_id] = {
          likeCount: likesResult.count || 0,
          purchaseCount: purchasesResult.count || 0
        };
      }));
      setTrackStats(stats);
    };
    fetchStats();
  }, [featuredTracks]);

  // Auto-rotate carousel when more than 1 track
  useEffect(() => {
    if (!featuredTracks || featuredTracks.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredTracks.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredTracks]);
  if (isLoading) {
    return <section className="py-8">
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
  const currentStats = trackStats[currentTrack.content_id];
  return <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-6 md:p-10">
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
                
                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCompactNumber(currentStats?.likeCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCompactNumber(currentStats?.purchaseCount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Collectors</p>
                    </div>
                  </div>
                  {currentTrack.track?.price && <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          ${currentTrack.track.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Price</p>
                      </div>
                    </div>}
                </div>
                
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
    data: recommendedArtists,
    isLoading: recommendationsLoading
  } = useRecommendedArtists(6);
  const {
    data: newReleases,
    isLoading: newReleasesLoading
  } = useNewReleases(6);
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
          text: "Join 10K+ Creators",
          icon: TrendingUp
        },
        heading: <>
            <span className="text-foreground">Where Artists</span>
            <br />
            <span className="text-gradient">Thrive.</span>
          </>,
        subheading: "Your sound. Your earnings. Your legacy. Join thousands of artists building their future on JumTunes.",
        ctas: <>
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
      <section className="relative min-h-[85vh] flex items-center overflow-hidden py-12 md:py-0 my-0">
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
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {heroContent.subheading}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {heroContent.ctas}
              </div>

              {/* Quick Stats for Guests */}
              {!user && <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 pt-8 border-t border-glass-border">
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
                </div>}
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

      {/* Karaoke Promo Banner */}
      <KaraokePromoBanner />

      {/* Featured Labels Section */}
      <FeaturedLabelsSection />

      {/* Discover Section - Only show for authenticated users */}
      {user && recommendedArtists && recommendedArtists.length > 0 && <section className="py-16 bg-card/20">
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

            {recommendationsLoading ? <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recommendedArtists.map(artist => {
              const following = isFollowing(artist.id);
              return <div key={artist.id} className="glass-card p-4 text-center group hover:bg-primary/10 transition-all duration-300">
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
      {user && recentlyPlayed.length > 0 && <section className="py-16">
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
              {recentlyPlayed.map(track => <div key={track.id} className="glass-card p-4 group cursor-pointer hover:bg-secondary/10 transition-all duration-300" onClick={() => playTrack({
              id: track.id,
              title: track.title,
              audio_url: "",
              cover_art_url: track.cover_art_url,
              artist: {
                id: track.artist_id,
                display_name: track.artist_name
              }
            })}>
                  <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                    {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" /> : <Disc3 className="w-12 h-12 text-muted-foreground" />}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                  }} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Play className="w-5 h-5 text-secondary-foreground ml-0.5" />
                      </button>
                      <button onClick={e => {
                    e.stopPropagation();
                    handleAddToQueue({
                      id: track.id,
                      title: track.title,
                      audio_url: "",
                      cover_art_url: track.cover_art_url,
                      artist: {
                        id: track.artist_id,
                        display_name: track.artist_name
                      }
                    });
                  }} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10" title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}>
                        {canUseFeature("addToQueue") ? <ListPlus className="w-5 h-5 text-white" /> : <Lock className="w-4 h-4 text-white/70" />}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors">
                    {track.title}
                  </h3>
                  <Link to={`/artist/${track.artist_id}`} onClick={e => e.stopPropagation()} className="text-sm text-muted-foreground hover:text-secondary transition-colors truncate block">
                    {track.artist_name || "Unknown Artist"}
                  </Link>
                </div>)}
            </div>
          </div>
        </section>}

      {/* Stats Section - Only show for guests */}
      {!user && <section className="py-16 bg-card/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>)}
            </div>
          </div>
        </section>}

      {/* Features Section - Only show for guests */}
      {!user && <section className="py-24">
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
              return <div key={index} className="glass-card p-6 group hover:bg-primary/10 transition-all duration-300">
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

      {/* Role CTA Section - Only show for guests */}
      {!user && <section className="py-24 bg-card/20">
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
        </section>}

      {/* New Releases Section */}
      {newReleases && newReleases.length > 0 && <section className="py-24 bg-card/20">
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

            {newReleasesLoading ? <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {newReleases.map(track => <div key={track.id} className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300" onClick={() => playTrack({
              id: track.id,
              title: track.title,
              audio_url: track.audio_url,
              cover_art_url: track.cover_art_url,
              artist: {
                id: track.artist_id,
                display_name: track.artist_name
              }
            })}>
                    <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                      {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" /> : <Disc3 className="w-12 h-12 text-muted-foreground" />}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                  }} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                        </button>
                        <button onClick={e => {
                    e.stopPropagation();
                    handleAddToQueue({
                      id: track.id,
                      title: track.title,
                      audio_url: track.audio_url,
                      cover_art_url: track.cover_art_url,
                      artist: {
                        id: track.artist_id,
                        display_name: track.artist_name
                      }
                    });
                  }} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10" title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}>
                          {canUseFeature("addToQueue") ? <ListPlus className="w-5 h-5 text-white" /> : <Lock className="w-4 h-4 text-white/70" />}
                        </button>
                        <div onClick={e => e.stopPropagation()}>
                          <DownloadButton track={{
                      id: track.id,
                      title: track.title,
                      cover_art_url: track.cover_art_url,
                      price: track.price,
                      audio_url: track.audio_url,
                      artist: {
                        display_name: track.artist_name
                      }
                    }} variant="ghost" size="icon" className="w-10 h-10 rounded-full border border-white/30 text-white hover:bg-white/10" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-xs font-medium text-primary-foreground">
                        NEW
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <Link to={`/artist/${track.artist_id}`} onClick={e => e.stopPropagation()} className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block">
                      {track.artist_name || "Unknown Artist"}
                    </Link>
                    <div className="text-xs text-primary font-semibold mt-1">
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
      <TrendingCarousel onAddToQueue={handleAddToQueue} />
      </div>
      <PremiumFeatureModal open={showPremiumModal} onOpenChange={setShowPremiumModal} feature="Add to Queue" />

      {/* Onboarding Tour for Fans */}
      {user && role === "fan" && <OnboardingTour open={showTour} onOpenChange={setShowTour} role="fan" onComplete={completeTour} />}

      {/* PWA Install Banner for mobile users */}
      <PWAInstallBanner />
    </Layout>;
}