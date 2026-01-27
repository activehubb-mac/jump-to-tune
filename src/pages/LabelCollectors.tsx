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
import { useLabelCollectors } from "@/hooks/useLabelCollectors";
import { formatPrice } from "@/lib/formatters";

export default function LabelCollectors() {
  const { user, role, isLoading } = useAuth();
  const { data: collectors, isLoading: collectorsLoading } = useLabelCollectors(user?.id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Collectors</h1>
            <p className="text-muted-foreground mb-8">Sign in to view your collectors.</p>
            <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle" asChild>
              <Link to="/auth?role=label">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Label Access Only</h1>
            <p className="text-muted-foreground mb-8">This page is for labels only.</p>
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
            <Link to="/label/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Collectors</h1>
            <p className="text-muted-foreground">People who have purchased your label's music</p>
          </div>
        </div>

        {collectorsLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : collectors && collectors.length > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-card p-6 text-center">
                <Users className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{collectors.length}</p>
                <p className="text-sm text-muted-foreground">Total Collectors</p>
              </div>
              <div className="glass-card p-6 text-center">
                <Music className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">
                  {collectors.reduce((sum, c) => sum + c.tracks_owned, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Editions Owned</p>
              </div>
              <div className="glass-card p-6 text-center md:col-span-1 col-span-2">
                <Calendar className="w-8 h-8 text-secondary mx-auto mb-2" />
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
                        <AvatarFallback className="bg-accent/20 text-accent">
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
              When fans purchase your label's music, they'll appear here. Share your tracks to grow your collector base!
            </p>
            <Button className="bg-accent hover:bg-accent/90" asChild>
              <Link to="/upload">Upload New Track</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
