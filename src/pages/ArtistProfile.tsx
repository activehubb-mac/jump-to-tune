import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Music, Users, Play, Pause, Heart, Share2, ExternalLink, Disc3, Loader2, UserPlus, UserMinus, ListPlus, Lock } from "lucide-react";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useTracks } from "@/hooks/useTracks";
import { useFeaturedOnTracks } from "@/hooks/useFeaturedOnTracks";
import { useFollow } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { formatPrice, formatEditions, formatCompactNumber } from "@/lib/formatters";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { FeaturedOnCarousel } from "@/components/artist/FeaturedOnCarousel";

export default function ArtistProfile() {
  const { id } = useParams();
  const { data: artist, isLoading: profileLoading } = useArtistProfile(id);
  const { data: tracks, isLoading: tracksLoading } = useTracks({ artistId: id, publishedOnly: true });
  const { data: featuredOnTracks } = useFeaturedOnTracks(id);
  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
  const { isFollowing, toggleFollow, isToggling } = useFollow();
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      showFeedback({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to follow artists",
      });
      return;
    }
    if (id && artist) {
      try {
        const result = await toggleFollow(id, artist.display_name || "Artist");
        showFeedback({
          type: "success",
          title: result.action === "followed" ? "Following" : "Unfollowed",
          message: result.artistName || artist.display_name || "Artist",
          autoCloseDelay: 2000,
        });
      } catch {
        showFeedback({
          type: "error",
          title: "Error",
          message: "Failed to update follow status",
        });
      }
    }
  };

    if (profileLoading) {
    return <Layout useBackground="subtle"><div className="container mx-auto px-4 py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!artist) {
    return <Layout useBackground="subtle"><div className="container mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-bold text-foreground">Artist not found</h1></div></Layout>;
  }

  const isOwnProfile = user?.id === id;
  const following = id ? isFollowing(id) : false;

  return (
    <Layout useBackground="subtle">
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-primary/30 to-background overflow-hidden">
        {artist.banner_image_url && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${artist.banner_image_url})` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow border-4 border-background overflow-hidden">
            {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" /> : <Music className="w-16 h-16 text-foreground" />}
          </div>

          <div className="flex-1">
            {artist.is_verified && <div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">Verified Artist</span></div>}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">{artist.display_name || "Unknown Artist"}</h1>
            <p className="text-muted-foreground max-w-2xl mb-4">{artist.bio || "No bio available"}</p>

            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2"><Music className="w-4 h-4 text-primary" /><span className="text-foreground font-medium">{artist.trackCount}</span><span className="text-muted-foreground">tracks</span></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-foreground font-medium">{formatCompactNumber(artist.followerCount)}</span><span className="text-muted-foreground">fans</span></div>
              <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /><span className="text-foreground font-medium">{formatCompactNumber(artist.likeCount)}</span><span className="text-muted-foreground">likes</span></div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isOwnProfile && (
                <Button 
                  className={following ? "border-glass-border" : "gradient-accent neon-glow-subtle hover:neon-glow"}
                  variant={following ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isToggling}
                >
                  {following ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" className="border-glass-border hover:border-primary/50"><Share2 className="w-4 h-4 mr-2" />Share</Button>
              {artist.website_url && <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild><a href={artist.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Website</a></Button>}
            </div>
          </div>
        </div>

        {/* Featured On Carousel */}
        {featuredOnTracks && featuredOnTracks.length > 0 && (
          <FeaturedOnCarousel
            tracks={featuredOnTracks}
            featuredArtistName={artist.display_name || "this artist"}
          />
        )}

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tracks</h2>
          </div>

          {tracksLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tracks && tracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tracks.map((track) => (
                <div key={track.id} className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
                  <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                    {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Disc3 className="w-12 h-12 text-muted-foreground/50" /></div>}
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        className="rounded-full gradient-accent w-10 h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack({
                            id: track.id,
                            title: track.title,
                            audio_url: track.audio_url,
                            cover_art_url: track.cover_art_url,
                            duration: track.duration,
                            artist: { id: artist.id, display_name: artist.display_name },
                          });
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50 relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canUseFeature("addToQueue")) {
                            setShowPremiumModal(true);
                            return;
                          }
                          addToQueue({
                            id: track.id,
                            title: track.title,
                            audio_url: track.audio_url,
                            cover_art_url: track.cover_art_url,
                            duration: track.duration,
                            artist: { id: artist.id, display_name: artist.display_name },
                          });
                        }}
                        title={canUseFeature("addToQueue") ? "Add to queue" : "Premium feature"}
                      >
                        <ListPlus className="w-4 h-4" />
                        {!canUseFeature("addToQueue") && (
                          <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-primary">{formatPrice(track.price)}</span>
                    <span className="text-xs text-muted-foreground">{formatEditions(track.editions_sold, track.total_editions)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground"><Disc3 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No tracks published yet</p></div>
          )}
        </section>
      </div>
    </Layout>
  );
}
