import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Users, Play, Pause, Heart, Share2, ExternalLink, Disc3, Loader2, UserPlus, UserMinus, ListPlus, Lock, Star, Store, Megaphone, Info, Globe, Bell, Plus, Pencil, Trash2 } from "lucide-react";
import { AnnouncementCard } from "@/components/artist/AnnouncementCard";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { ActivityFeed } from "@/components/artist/ActivityFeed";
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
import { BannerUpload } from "@/components/profile/BannerUpload";
import { useQueryClient } from "@tanstack/react-query";
import { useArtistStore } from "@/hooks/useArtistStore";
import { ArtistStoreTab } from "@/components/store/ArtistStoreTab";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { SpotifyEmbed } from "@/components/profile/SpotifyEmbed";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDJSessions, useDeleteDJSession } from "@/hooks/useDJSessions";
import { useDJTier } from "@/hooks/useDJTiers";
import { SessionCard } from "@/components/godj/SessionCard";
import { DJBadge } from "@/components/godj/DJBadge";
import { CreateSessionModal } from "@/components/godj/CreateSessionModal";
import { EditSessionModal } from "@/components/godj/EditSessionModal";
import { useDJActivation } from "@/hooks/useDJActivation";
import { useGoDJSessions, useDeleteGoDJSession } from "@/hooks/useGoDJSessions";
import { useGoDJProfile, useActivateGoDJ } from "@/hooks/useGoDJProfile";
import { MixWizard } from "@/components/godj-mix/MixWizard";
import { MixSessionCard } from "@/components/godj-mix/MixSessionCard";
import { Headphones } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { DJSession } from "@/hooks/useDJSessions";

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
  const queryClient = useQueryClient();
  const { isActive: hasActiveStore } = useArtistStore(id);
  const { data: djSessions } = useDJSessions(id);
  const { data: djTier } = useDJTier(id);
  const { isActivated: djActivated, isLoading: djActivationLoading, activate: djActivate } = useDJActivation();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showMixWizard, setShowMixWizard] = useState(false);
  const [editSession, setEditSession] = useState<DJSession | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const deleteSession = useDeleteDJSession();
  const { data: mixSessions } = useGoDJSessions(id);
  const deleteMixSession = useDeleteGoDJSession();
  const [deleteMixSessionId, setDeleteMixSessionId] = useState<string | null>(null);
  const { data: goDJProfile } = useGoDJProfile(id);
  const activateGoDJ = useActivateGoDJ();

  // Fetch genres for About tab
  const { data: genres } = useQuery({
    queryKey: ["profile-genres", id],
    queryFn: async () => {
      const { data } = await supabase.from("profile_genres").select("genre").eq("profile_id", id!);
      return data?.map((g) => g.genre) || [];
    },
    enabled: !!id,
  });

  const { announcements } = useAnnouncements(id);
  const highlightedAnnouncement = announcements.find((a) => a.is_highlighted);

  const handleFollow = async () => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign in required", message: "Please sign in to follow artists" });
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
        showFeedback({ type: "error", title: "Error", message: "Failed to update follow status" });
      }
    }
  };

  if (profileLoading) {
    return <Layout><div className="container mx-auto px-4 py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!artist) {
    return <Layout><div className="container mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-bold text-foreground">Artist not found</h1></div></Layout>;
  }

  const isOwnProfile = user?.id === id;
  const following = id ? isFollowing(id) : false;

  const bannerContent = (
    <>
      {!isOwnProfile && artist.banner_image_url && (
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${artist.banner_image_url})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
    </>
  );

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />
      {isOwnProfile && id ? (
        <BannerUpload
          userId={id}
          currentBannerUrl={artist.banner_image_url}
          onUploadSuccess={async () => {
            queryClient.invalidateQueries({ queryKey: ["artist-profile", id] });
          }}
          className="relative h-64 md:h-80 bg-muted/30 overflow-hidden"
        >
          {bannerContent}
        </BannerUpload>
      ) : (
        <div className="relative h-64 md:h-80 bg-muted/30 overflow-hidden">
          {bannerContent}
        </div>
      )}

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="w-40 h-40 rounded-full bg-primary flex items-center justify-center border-4 border-background overflow-hidden">
            {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" /> : <Music className="w-16 h-16 text-primary-foreground" />}
          </div>

          <div className="flex-1">
            {artist.is_verified && <div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">Verified Artist</span></div>}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2" style={{ fontFamily: `'${artist.display_name_font || 'Inter'}', sans-serif` }}>{artist.display_name || "Unknown Artist"}</h1>
            <p className="text-muted-foreground max-w-2xl mb-4">{artist.bio || "No bio available"}</p>

            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2"><Music className="w-4 h-4 text-primary" /><span className="text-foreground font-medium">{artist.trackCount}</span><span className="text-muted-foreground">tracks</span></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-foreground font-medium">{formatCompactNumber(artist.followerCount)}</span><span className="text-muted-foreground">fans</span></div>
              <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /><span className="text-foreground font-medium">{formatCompactNumber(artist.likeCount)}</span><span className="text-muted-foreground">likes</span></div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isOwnProfile && (
                <Button 
                  className={following ? "border-glass-border" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                  variant={following ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isToggling}
                >
                  {following ? <><UserMinus className="w-4 h-4 mr-2" />Following</> : <><UserPlus className="w-4 h-4 mr-2" />Follow</>}
                </Button>
              )}
              <Button variant="outline" className="border-glass-border hover:border-primary/50" onClick={() => { navigator.clipboard.writeText(window.location.href); showFeedback({ type: "success", title: "Link copied!", message: "Profile link copied to clipboard", autoCloseDelay: 2000 }); }}><Share2 className="w-4 h-4 mr-2" />Share</Button>
              <Button variant="outline" className="border-glass-border hover:border-primary/50" asChild>
                <Link to={`/artist/${id}/superfan`}>
                  <Star className="w-4 h-4 mr-2" />
                  Superfan Room
                </Link>
              </Button>
              {artist.website_url && <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild><a href={artist.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Website</a></Button>}
            </div>
          </div>
        </div>

        {/* Highlighted Announcement Banner */}
        {highlightedAnnouncement && (
          <div className="glass-card p-4 mb-6 border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">{highlightedAnnouncement.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{highlightedAnnouncement.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="superfan" className="mb-12">
          <TabsList className="glass mb-6 flex-wrap">
            <TabsTrigger value="superfan" className="flex items-center gap-2">
              <Star className="w-4 h-4" /> Superfan
            </TabsTrigger>
            {hasActiveStore && (
              <TabsTrigger value="store" className="flex items-center gap-2">
                <Store className="w-4 h-4" /> Store
              </TabsTrigger>
            )}
            <TabsTrigger value="godj" className="flex items-center gap-2">
              <Disc3 className="w-4 h-4" /> Go DJ
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="w-4 h-4" /> Music
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Activity
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" /> About
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> Find Me
            </TabsTrigger>
          </TabsList>

          {/* Superfan Tab - Links to Superfan Room */}
          <TabsContent value="superfan">
            <div className="glass-card p-8 text-center space-y-4">
              <Star className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-2xl font-bold text-foreground">Superfan Room</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Get exclusive content, early access, direct messaging, and VIP supporter badges.
              </p>
              <Button className="gradient-accent" asChild>
                <Link to={`/artist/${id}/superfan`}>Enter Superfan Room</Link>
              </Button>
            </div>
          </TabsContent>

          {/* Store Tab */}
          {hasActiveStore && (
            <TabsContent value="store">
              <ArtistStoreTab artistId={id!} artistName={artist.display_name || "Artist"} />
            </TabsContent>
          )}

          {/* Go DJ Tab */}
          <TabsContent value="godj">
            <div className="space-y-6">
              {/* Own profile: activation or creation controls */}
              {isOwnProfile && !djActivated && !djActivationLoading && (
                <div className="glass-card p-8 text-center space-y-4">
                  <Disc3 className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold text-foreground">Enable Go DJ Mode</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start curating sessions, build your listener base, and unlock paid submissions.
                  </p>
                   <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => {
                      djActivate.mutate();
                      activateGoDJ.mutate();
                    }}
                    disabled={djActivate.isPending || activateGoDJ.isPending}
                  >
                    {(djActivate.isPending || activateGoDJ.isPending) ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activating...</> : "Activate Go DJ"}
                  </Button>
                </div>
              )}

              {/* Header with badge + create button */}
              {(djActivated || !isOwnProfile) && (
                <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Disc3 className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Go DJ</h3>
                      <p className="text-sm text-muted-foreground">Curated sessions by {artist.display_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {djTier && <DJBadge tier={djTier.current_tier} />}
                    {djTier && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Headphones className="w-4 h-4" />
                        <span>{djTier.lifetime_listeners.toLocaleString()} lifetime listeners</span>
                      </div>
                    )}
                    {isOwnProfile && djTier && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {(djSessions?.filter(s => s.status === 'active' || s.status === 'scheduled').length || 0)}/{djTier.max_slots} slots
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => setShowMixWizard(true)}
                        >
                          <Plus className="w-4 h-4 mr-1" /> New Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Session lists */}
              {(() => {
                const active = djSessions?.filter(s => s.status === 'active') || [];
                const scheduled = djSessions?.filter(s => s.status === 'scheduled') || [];
                const archived = djSessions?.filter(s => s.status === 'archived') || [];

                const renderSessionCard = (s: DJSession) => (
                  <div key={s.id} className="relative group">
                    <SessionCard session={s} artistName={artist.display_name || "DJ"} artistAvatar={artist.avatar_url || undefined} tier={djTier?.current_tier} />
                    {isOwnProfile && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditSession(s); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteSessionId(s.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );

                return (
                  <>
                    {active.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Active Sessions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {active.map(renderSessionCard)}
                        </div>
                      </div>
                    )}
                    {scheduled.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Upcoming Sessions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {scheduled.map(renderSessionCard)}
                        </div>
                      </div>
                    )}
                    {archived.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Archived</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {archived.map(renderSessionCard)}
                        </div>
                      </div>
                    )}

                    {/* Mix Sessions (new system) */}
                    {mixSessions && mixSessions.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">Session Mixes</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {mixSessions.map((ms) => (
                            <div key={ms.id} className="relative group">
                              <MixSessionCard
                                session={ms}
                                djName={artist.display_name || "DJ"}
                                djAvatar={artist.avatar_url}
                                isOwner={isOwnProfile}
                              />
                              {isOwnProfile && (
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteMixSessionId(ms.id); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!active.length && !scheduled.length && !archived.length && (!mixSessions || mixSessions.length === 0) && (djActivated || !isOwnProfile) && (
                      <div className="glass-card p-12 text-center">
                        <Disc3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No Go DJ sessions yet</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Create Session Modal */}
            {isOwnProfile && djTier && (
              <CreateSessionModal
                open={showCreateSession}
                onOpenChange={setShowCreateSession}
                activeCount={djSessions?.filter(s => s.status === 'active' || s.status === 'scheduled').length || 0}
                maxSlots={djTier.max_slots}
              />
            )}

            {/* Mix Wizard Modal */}
            {isOwnProfile && (
              <MixWizard open={showMixWizard} onOpenChange={setShowMixWizard} />
            )}

            {/* Edit Session Modal */}
            {editSession && (
              <EditSessionModal
                open={!!editSession}
                onOpenChange={(v) => { if (!v) setEditSession(null); }}
                session={editSession}
              />
            )}

            {/* Delete Confirmation (legacy sessions) */}
            <AlertDialog open={!!deleteSessionId} onOpenChange={(v) => { if (!v) setDeleteSessionId(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the session and all its tracks. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      if (!deleteSessionId) return;
                      try {
                        await deleteSession.mutateAsync(deleteSessionId);
                        toast.success("Session deleted");
                      } catch {
                        toast.error("Failed to delete session");
                      }
                      setDeleteSessionId(null);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music">
            {featuredOnTracks && featuredOnTracks.length > 0 && (
              <FeaturedOnCarousel
                tracks={featuredOnTracks}
                featuredArtistName={artist.display_name || "this artist"}
              />
            )}

            <section>
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
                        <div className="absolute inset-0 bg-[#1a1a1a]/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            {announcements.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" /> Announcements
                </h3>
                {announcements.slice(0, 5).map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            )}
            <ActivityFeed artistId={id!} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="space-y-6 max-w-2xl">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-3">About</h3>
                <p className="text-muted-foreground">{artist.bio || "No bio available."}</p>
                {artist.is_verified && (
                  <Badge className="mt-3 bg-primary/20 text-primary">✓ Verified Artist</Badge>
                )}
              </div>

              {genres && genres.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge key={genre} variant="outline" className="border-glass-border">{genre}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {artist.website_url && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">Website</h3>
                  <a href={artist.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {artist.website_url}
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Find Me Everywhere Tab */}
          <TabsContent value="links">
            <div className="max-w-2xl">
              <div className="glass-card p-6 mb-6 text-center">
                <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Find Me Everywhere</h3>
                <p className="text-sm text-muted-foreground">Connect with {artist.display_name || "this artist"} across platforms</p>
              </div>

              {/* Spotify Embed — only when artist enabled it and has a valid Spotify URL */}
              {(() => {
                const sl = artist.social_links as Record<string, string> | null;
                const showEmbed = sl?.show_spotify_embed === "true";
                const spotifyUrl = sl?.spotify_playlist || sl?.spotify_track || sl?.spotify;
                if (!showEmbed || !spotifyUrl) return null;
                return (
                  <div className="glass-card p-4 mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      🎧 Listen on Spotify
                    </h4>
                    <SpotifyEmbed
                      url={spotifyUrl}
                      variant={sl?.spotify_playlist ? "full" : "compact"}
                    />
                  </div>
                );
              })()}

              <SocialLinksSection
                socialLinks={artist.social_links || null}
                isVerified={artist.is_verified || false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
