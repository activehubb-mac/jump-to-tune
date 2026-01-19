import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Users, Music, Loader2, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useLabels } from "@/hooks/useLabels";
import { useFeaturedLabels } from "@/hooks/useFeaturedContent";

export default function Labels() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: labels, isLoading } = useLabels({ searchQuery: searchQuery || undefined });
  const { data: featuredLabelsData, isLoading: featuredLoading } = useFeaturedLabels("labels_page");

  // Use admin-curated featured labels if available, otherwise fall back to first 2
  const featuredLabels = useMemo(() => {
    if (featuredLabelsData && featuredLabelsData.length > 0) {
      // Map featured content to label data
      return featuredLabelsData
        .map(featured => labels?.find(l => l.id === featured.content_id))
        .filter(Boolean) as typeof labels;
    }
    // Fallback to first 2 if no admin-curated featured labels
    return labels?.slice(0, 2) || [];
  }, [featuredLabelsData, labels]);

  const allLabels = labels || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Labels</h1>
          <p className="text-muted-foreground">Explore music labels and their artist rosters</p>
        </div>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search labels..." className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {isLoading || featuredLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : allLabels.length > 0 ? (
          <>
            {featuredLabels && featuredLabels.length > 0 && !searchQuery && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-foreground">Featured Labels</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredLabels.map((label) => (
                    <Link key={label.id} to={`/label/${label.id}`} className="glass-card p-6 group hover:bg-accent/10 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-accent/50 to-primary/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {label.avatar_url ? <img src={label.avatar_url} alt={label.display_name || ""} className="w-full h-full object-cover" /> : <Building2 className="w-12 h-12 text-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">{label.display_name || "Unknown Label"}</h3>
                            {label.is_verified && (
                              <span title="Verified Label">
                                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{label.bio || "No description available"}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{label.artistCount} artists</span>
                            <span className="flex items-center gap-1"><Music className="w-4 h-4" />{label.trackCount} tracks</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">All Labels</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allLabels.map((label) => (
                  <Link key={label.id} to={`/label/${label.id}`} className="glass-card p-6 text-center group hover:bg-accent/10 transition-all duration-300">
                    <div className="w-20 h-20 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                      {label.avatar_url ? <img src={label.avatar_url} alt={label.display_name || ""} className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="font-semibold text-foreground">{label.display_name || "Unknown"}</h3>
                      {label.is_verified && (
                        <span title="Verified Label">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{label.artistCount} artists</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-24">
            <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No labels found</h3>
            <p className="text-muted-foreground">{searchQuery ? "Try a different search" : "Be the first label to join!"}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
