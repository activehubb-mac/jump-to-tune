import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Users, 
  Music,
  Loader2,
  Lock,
  AlertCircle,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatters";

interface Collector {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_spent: number;
  tracks_owned: number;
  first_purchase: string;
}

function useArtistCollectors(artistId: string | undefined) {
  return useQuery({
    queryKey: ["artist-collectors", artistId],
    queryFn: async (): Promise<Collector[]> => {
      if (!artistId) return [];

      // Get all tracks for this artist
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", artistId);

      if (!tracks || tracks.length === 0) return [];

      const trackIds = tracks.map((t) => t.id);

      // Get purchases for these tracks with user info
      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          user_id,
          price_paid,
          purchased_at
        `)
        .in("track_id", trackIds);

      if (!purchases || purchases.length === 0) return [];

      // Aggregate by user
      const userMap = new Map<string, {
        total_spent: number;
        tracks_owned: number;
        first_purchase: string;
      }>();

      purchases.forEach((p) => {
        const existing = userMap.get(p.user_id);
        if (existing) {
          existing.total_spent += Number(p.price_paid);
          existing.tracks_owned += 1;
          if (new Date(p.purchased_at) < new Date(existing.first_purchase)) {
            existing.first_purchase = p.purchased_at;
          }
        } else {
          userMap.set(p.user_id, {
            total_spent: Number(p.price_paid),
            tracks_owned: 1,
            first_purchase: p.purchased_at,
          });
        }
      });

      // Get profile info for each user
      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      // Combine data
      return profiles?.map((profile) => {
        const userData = userMap.get(profile.id)!;
        return {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          ...userData,
        };
      }).sort((a, b) => b.total_spent - a.total_spent) ?? [];
    },
    enabled: !!artistId,
  });
}

export default function ArtistCollectors() {
  const { user, role, isLoading } = useAuth();
  const { data: collectors, isLoading: collectorsLoading } = useArtistCollectors(user?.id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Collectors</h1>
            <p className="text-muted-foreground mb-8">Sign in to view your collectors.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth?role=artist">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (role !== "artist") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist Access Only</h1>
            <p className="text-muted-foreground mb-8">This page is for artists only.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/artist/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Collectors</h1>
            <p className="text-muted-foreground">People who have purchased your music</p>
          </div>
        </div>

        {collectorsLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : collectors && collectors.length > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-card p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{collectors.length}</p>
                <p className="text-sm text-muted-foreground">Total Collectors</p>
              </div>
              <div className="glass-card p-6 text-center">
                <Music className="w-8 h-8 text-secondary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">
                  {collectors.reduce((sum, c) => sum + c.tracks_owned, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Editions Owned</p>
              </div>
              <div className="glass-card p-6 text-center md:col-span-1 col-span-2">
                <Calendar className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">
                  {formatPrice(collectors.reduce((sum, c) => sum + c.total_spent, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>

            {/* Collectors List */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">All Collectors</h2>
              <div className="space-y-4">
                {collectors.map((collector) => (
                  <div
                    key={collector.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={collector.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(collector.display_name || "C")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {collector.display_name || "Anonymous Collector"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Collector since {new Date(collector.first_purchase).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(collector.total_spent)}</p>
                      <p className="text-sm text-muted-foreground">
                        {collector.tracks_owned} edition{collector.tracks_owned !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Collectors Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              When fans purchase your music, they'll appear here. Share your tracks to grow your collector base!
            </p>
            <Button className="gradient-accent" asChild>
              <Link to="/upload">Upload New Track</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
