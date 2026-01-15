import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, Disc3, Users, Building2, Headphones, Zap, TrendingUp, Shield, Upload, LayoutDashboard, Library, Sparkles, UserPlus, UserMinus, Loader2, Play, Clock, History, ListPlus, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { useFollow } from "@/hooks/useFollows";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useNewReleases } from "@/hooks/useNewReleases";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatCompactNumber } from "@/lib/formatters";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useState } from "react";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
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
  const { user, role, profile } = useAuth();
  const { data: recommendedArtists, isLoading: recommendationsLoading } = useRecommendedArtists(6);
  const { data: trendingTracks, isLoading: trendingLoading } = useTrendingTracks(6);
  const { data: newReleases, isLoading: newReleasesLoading } = useNewReleases(6);
  const { recentlyPlayed } = useRecentlyPlayed(6);
  const { isFollowing, toggleFollow } = useFollow();
  const { showFeedback } = useFeedbackSafe();
  const { playTrack, addToQueue } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
      // Not logged in - show default marketing
      return {
        badge: "The Future of Music Ownership",
        heading: (
          <>
            <span className="text-foreground">Collect Music.</span>
            <br />
            <span className="text-gradient">Own the Experience.</span>
          </>
        ),
        subheading: "JumTunes is where fans become collectors. Discover exclusive tracks, support your favorite artists, and build a music collection that's truly yours.",
        ctas: (
          <>
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
          </>
        ),
      };
    }

    const displayName = profile?.display_name || "there";

    if (role === "fan") {
      return {
        badge: "Welcome Back, Collector",
        heading: (
          <>
            <span className="text-foreground">Hey {displayName}!</span>
            <br />
            <span className="text-gradient">Ready to Discover?</span>
          </>
        ),
        subheading: "Explore new releases from your favorite artists, grow your collection, and find your next favorite track.",
        ctas: (
          <>
            <Button
              size="lg"
              className="gradient-accent neon-glow hover:scale-105 transition-all duration-300 text-lg px-8"
              asChild
            >
              <Link to="/browse">
                <Music className="w-5 h-5 mr-2" />
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
        badge: "Artist Studio",
        heading: (
          <>
            <span className="text-foreground">Welcome, {displayName}!</span>
            <br />
            <span className="text-gradient">Share Your Sound.</span>
          </>
        ),
        subheading: "Upload new tracks, connect with your collectors, and grow your fanbase on JumTunes.",
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
        badge: "Label HQ",
        heading: (
          <>
            <span className="text-foreground">Welcome, {displayName}!</span>
            <br />
            <span className="text-gradient">Manage Your Roster.</span>
          </>
        ),
        subheading: "Upload music for your artists, manage your roster, and track your label's performance.",
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

    // Fallback for any edge case
    return {
      badge: "Welcome to JumTunes",
      heading: (
        <>
          <span className="text-foreground">Collect Music.</span>
          <br />
          <span className="text-gradient">Own the Experience.</span>
        </>
      ),
      subheading: "JumTunes is where fans become collectors. Discover exclusive tracks, support your favorite artists, and build a music collection that's truly yours.",
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
              <span className="text-sm text-muted-foreground">{heroContent.badge}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {heroContent.heading}
            </h1>

            {/* Subheading */}
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {heroContent.subheading}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {heroContent.ctas}
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

      {/* Trending Section */}
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

          {trendingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : trendingTracks && trendingTracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingTracks.map((track) => (
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
                        className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 text-accent-foreground ml-0.5" />
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
          ) : (
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
          )}

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/browse">View All Tracks</Link>
            </Button>
          </div>
        </div>
      </section>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />
    </Layout>
  );
}
