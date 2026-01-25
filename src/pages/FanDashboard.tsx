import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks } from "@/hooks/useLikes";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Library,
  Heart,
  Users,
  DollarSign,
  Play,
  Clock,
  Music,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Headphones,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function FanDashboard() {
  const { user, isLoading: authLoading, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: ownedLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { recentlyPlayed } = useRecentlyPlayed(6);
  const { data: recommendedArtists, isLoading: artistsLoading } = useRecommendedArtists(4);
  const { playTrack } = useAudioPlayer();

  // Redirect non-fans to their respective dashboards
  if (!authLoading && role && role !== "fan") {
    if (role === "artist") return <Navigate to="/artist/dashboard" replace />;
    if (role === "label") return <Navigate to="/label/dashboard" replace />;
  }

  // Loading state
  if (authLoading) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-16 text-center">
          <Headphones className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Track your listening history, discover new artists, and manage your library.
          </p>
          <Button asChild className="gradient-accent">
            <Link to="/auth?mode=signin">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url || "",
      cover_art_url: track.cover_art_url,
      artist: {
        id: track.artist?.id || track.artist_id || "",
        display_name: track.artist?.display_name || track.artist_name || "Unknown Artist",
      },
    });
  };

  return (
    <Layout useBackground="subtle">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden box-border">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">Your Dashboard</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Welcome back! Here's your personalized music overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-glass border-glass-border">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <Library className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" /> : stats?.tracksOwned || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Owned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass-border">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10 shrink-0">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {likedLoading ? <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" /> : likedTracks?.length || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Liked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass-border">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {statsLoading ? <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" /> : stats?.artistsFollowed || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass-border">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold truncate">
                    {statsLoading ? (
                      <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                    ) : (
                      `$${(stats?.totalSpent || 0).toFixed(2)}`
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recently Played */}
          <Card className="lg:col-span-2 bg-glass border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-0 sm:pb-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Recently Played
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
                <Link to="/library" className="text-muted-foreground hover:text-foreground">
                  View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {recentlyPlayed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No listening history yet</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link to="/browse">Start exploring music</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentlyPlayed.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {track.cover_art_url ? (
                          <img
                            src={track.cover_art_url}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist_name || "Unknown Artist"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(track.playedAt, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discover Artists */}
          <Card className="bg-glass border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-0 sm:pb-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                Discover
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
                <Link to="/artists" className="text-muted-foreground hover:text-foreground">
                  All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {artistsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recommendedArtists && recommendedArtists.length > 0 ? (
                <div className="space-y-3">
                  {recommendedArtists.map((artist) => (
                    <Link
                      key={artist.id}
                      to={`/artist/${artist.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback>
                          {artist.display_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {artist.display_name || "Unknown Artist"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {artist.trackCount} tracks • {artist.followerCount} followers
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Follow artists to get recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases */}
        <Card className="mt-4 sm:mt-6 bg-glass border-glass-border">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-0 sm:pb-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              Recent Purchases
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
              <Link to="/library" className="text-muted-foreground hover:text-foreground">
                Library <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {ownedLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <Skeleton className="aspect-square rounded-lg mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : ownedTracks && ownedTracks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {ownedTracks.slice(0, 6).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      purchase.track && handlePlayTrack(purchase.track)
                    }
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      {purchase.track?.cover_art_url ? (
                        <img
                          src={purchase.track.cover_art_url}
                          alt={purchase.track?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                        #{purchase.edition_number}
                      </div>
                    </div>
                    <p className="font-medium text-sm truncate">
                      {purchase.track?.title || "Unknown Track"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {purchase.track?.artist?.display_name || "Unknown Artist"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Library className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No purchases yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/browse">Browse tracks to buy</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Horizontal scroll on mobile */}
        <div className="mt-4 sm:mt-6 flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible">
          <Button asChild className="gradient-accent neon-glow-subtle shrink-0 text-xs sm:text-sm">
            <Link to="/for-you">
              <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
              For You
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-glass-border shrink-0 text-xs sm:text-sm">
            <Link to="/browse">
              <Music className="w-4 h-4 mr-1 sm:mr-2" />
              Browse
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-glass-border shrink-0 text-xs sm:text-sm">
            <Link to="/library">
              <Library className="w-4 h-4 mr-1 sm:mr-2" />
              Library
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-glass-border shrink-0 text-xs sm:text-sm">
            <Link to="/wallet">
              <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
              Wallet
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
