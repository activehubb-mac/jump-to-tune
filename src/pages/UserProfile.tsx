import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, Users, Heart, Share2, ExternalLink, Disc3, Loader2, 
  UserPlus, UserMinus, Building2, Library, Play, Pause, ListPlus, Lock 
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTracks } from "@/hooks/useTracks";
import { useFollow } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { formatCompactNumber, formatPrice, formatEditions } from "@/lib/formatters";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { BannerUpload } from "@/components/profile/BannerUpload";

export default function UserProfile() {
  const { id } = useParams();
  const { data: profile, isLoading } = useUserProfile(id);
  const { data: tracks, isLoading: tracksLoading } = useTracks({
    artistId: profile?.role === "artist" ? id : undefined,
    labelId: profile?.role === "label" ? id : undefined,
    publishedOnly: true,
  });
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
        message: "Please sign in to follow users",
      });
      return;
    }
    if (id && profile) {
      try {
        const result = await toggleFollow(id, profile.display_name || "User");
        showFeedback({
          type: "success",
          title: result.action === "followed" ? "Following" : "Unfollowed",
          message: result.artistName || profile.display_name || "User",
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

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = user?.id === id;
  const following = id ? isFollowing(id) : false;

  const getRoleBadge = () => {
    switch (profile.role) {
      case "artist":
        return (
          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
            <Music className="w-3 h-3 mr-1" />
            Artist
          </Badge>
        );
      case "label":
        return (
          <Badge variant="default" className="bg-accent/20 text-accent border-accent/30">
            <Building2 className="w-3 h-3 mr-1" />
            Label
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Heart className="w-3 h-3 mr-1" />
            Fan
          </Badge>
        );
    }
  };

  const getAccentColor = () => {
    switch (profile.role) {
      case "artist":
        return "primary";
      case "label":
        return "accent";
      default:
        return "secondary";
    }
  };

  const accentColor = getAccentColor();

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />

      {/* Hero Banner */}
      {isOwnProfile ? (
        <BannerUpload
          userId={user.id}
          currentBannerUrl={profile.banner_image_url}
          className="relative h-64 md:h-80 overflow-hidden"
        >
          {/* Fallback gradient if no banner */}
          {!profile.banner_image_url && (
            <div className={`absolute inset-0 bg-gradient-to-b from-${accentColor}/30 to-background`} />
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
        </BannerUpload>
      ) : (
        <div className={`relative h-64 md:h-80 overflow-hidden`}>
          {profile.banner_image_url ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.banner_image_url})` }}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-b from-${accentColor}/30 to-background`} />
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
        </div>
      )}

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          {/* Avatar */}
          <div className={`w-40 h-40 ${profile.role === "label" ? "rounded-2xl" : "rounded-full"} bg-gradient-to-br from-${accentColor} to-primary flex items-center justify-center neon-glow border-4 border-background overflow-hidden`}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || ""}
                className="w-full h-full object-cover"
              />
            ) : profile.role === "label" ? (
              <Building2 className="w-16 h-16 text-foreground" />
            ) : (
              <Music className="w-16 h-16 text-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getRoleBadge()}
              {profile.is_verified && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  Verified
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              {profile.display_name || "Unknown User"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-4">
              {profile.bio || "No bio available"}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
              {profile.role === "artist" && (
                <>
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{profile.trackCount}</span>
                    <span className="text-muted-foreground">tracks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    <span className="text-foreground font-medium">{formatCompactNumber(profile.likeCount)}</span>
                    <span className="text-muted-foreground">likes</span>
                  </div>
                </>
              )}
              {profile.role === "label" && (
                <>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-foreground font-medium">{profile.artistCount}</span>
                    <span className="text-muted-foreground">artists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-accent" />
                    <span className="text-foreground font-medium">{profile.trackCount}</span>
                    <span className="text-muted-foreground">tracks</span>
                  </div>
                </>
              )}
              {profile.role === "fan" && (
                <>
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{profile.ownedTrackCount}</span>
                    <span className="text-muted-foreground">owned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    <span className="text-foreground font-medium">{formatCompactNumber(profile.likeCount)}</span>
                    <span className="text-muted-foreground">likes</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">{formatCompactNumber(profile.followerCount)}</span>
                <span className="text-muted-foreground">followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{formatCompactNumber(profile.followingCount)}</span>
                <span className="text-muted-foreground">following</span>
              </div>
            </div>

            {/* Actions */}
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
              <Button variant="outline" className="border-glass-border hover:border-primary/50">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {profile.website_url && (
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tracks Section (for Artists and Labels) */}
        {(profile.role === "artist" || profile.role === "label") && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {profile.role === "artist" ? "Tracks" : "Releases"}
              </h2>
              {profile.role === "artist" && (
                <Button variant="ghost" className="text-primary" asChild>
                  <Link to={`/artist/${id}`}>View Full Profile</Link>
                </Button>
              )}
              {profile.role === "label" && (
                <Button variant="ghost" className="text-accent" asChild>
                  <Link to={`/label/${id}`}>View Full Profile</Link>
                </Button>
              )}
            </div>

            {tracksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tracks && tracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tracks.slice(0, 10).map((track) => (
                  <div
                    key={track.id}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                  >
                    <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                      {track.cover_art_url ? (
                        <img
                          src={track.cover_art_url}
                          alt={track.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
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
                              artist: { id: track.artist_id, display_name: track.artist?.display_name },
                            });
                          }}
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
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
                              artist: { id: track.artist_id, display_name: track.artist?.display_name },
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
                      <span className="text-xs text-muted-foreground">
                        {formatEditions(track.editions_sold, track.total_editions)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Disc3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tracks published yet</p>
              </div>
            )}
          </section>
        )}

        {/* Fan Stats Section */}
        {profile.role === "fan" && (
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 text-center">
                <Library className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">{profile.ownedTrackCount}</h3>
                <p className="text-muted-foreground">Tracks Owned</p>
              </div>
              <div className="glass-card p-6 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-3xl font-bold text-foreground">{profile.likeCount}</h3>
                <p className="text-muted-foreground">Tracks Liked</p>
              </div>
              <div className="glass-card p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">{profile.followingCount}</h3>
                <p className="text-muted-foreground">Artists Following</p>
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        {profile.bio && (
          <section className="glass-card p-8 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        )}
      </div>
    </Layout>
  );
}
