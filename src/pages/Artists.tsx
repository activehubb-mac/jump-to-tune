import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Music, Users, Loader2, UserPlus, UserMinus } from "lucide-react";
import { Link } from "react-router-dom";
import { useArtists } from "@/hooks/useArtists";
import { useFollow } from "@/hooks/useFollows";
import { useFollowerCounts } from "@/hooks/useFollowerCounts";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { formatCompactNumber } from "@/lib/formatters";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: artists, isLoading } = useArtists({ searchQuery: searchQuery || undefined });
  const { isFollowing, toggleFollow } = useFollow();
  const { user } = useAuth();
  const { showFeedback } = useFeedback();

  const artistIds = useMemo(() => artists?.map((a) => a.id) || [], [artists]);
  const { data: followerCounts = {} } = useFollowerCounts(artistIds);

  const featuredArtists = artists?.slice(0, 3) || [];
  const allArtists = artists || [];

  const handleFollow = async (e: React.MouseEvent, artistId: string, artistName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Artists</h1>
          <p className="text-muted-foreground">Discover talented artists and explore their music collections</p>
        </div>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : allArtists.length > 0 ? (
          <>
            {featuredArtists.length > 0 && !searchQuery && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">Featured Artists</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredArtists.map((artist) => {
                    const following = isFollowing(artist.id);
                    const isOwnProfile = user?.id === artist.id;
                    const followers = followerCounts[artist.id] || artist.followerCount || 0;
                    
                    return (
                      <Link key={artist.id} to={`/artist/${artist.id}`} className="glass-card p-6 group hover:bg-primary/10 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" /> : <Music className="w-8 h-8 text-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{artist.display_name || "Unknown Artist"}</h3>
                              {!isOwnProfile && (
                                <Button
                                  size="sm"
                                  variant={following ? "outline" : "default"}
                                  className={following ? "border-glass-border" : "gradient-accent"}
                                  onClick={(e) => handleFollow(e, artist.id, artist.display_name || "Artist")}
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
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{artist.bio || "No bio available"}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Music className="w-4 h-4" />{artist.trackCount} tracks</span>
                              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{formatCompactNumber(followers)} fans</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">All Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {allArtists.map((artist) => {
                  const following = isFollowing(artist.id);
                  const isOwnProfile = user?.id === artist.id;
                  const followers = followerCounts[artist.id] || artist.followerCount || 0;

                  return (
                    <Link key={artist.id} to={`/artist/${artist.id}`} className="glass-card p-4 text-center group hover:bg-primary/10 transition-all duration-300">
                      <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                        {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" /> : <Music className="w-10 h-10 text-muted-foreground" />}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{artist.display_name || "Unknown"}</h3>
                      <p className="text-sm text-muted-foreground">{artist.trackCount} tracks</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        {formatCompactNumber(followers)} fans
                      </p>
                      {!isOwnProfile && (
                        <Button
                          size="sm"
                          variant={following ? "outline" : "default"}
                          className={`mt-3 w-full ${following ? "border-glass-border" : "gradient-accent"}`}
                          onClick={(e) => handleFollow(e, artist.id, artist.display_name || "Artist")}
                        >
                          {following ? "Following" : "Follow"}
                        </Button>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-24">
            <Music className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No artists found</h3>
            <p className="text-muted-foreground">{searchQuery ? "Try a different search" : "Be the first to join!"}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
