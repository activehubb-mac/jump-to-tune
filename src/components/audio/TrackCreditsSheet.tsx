import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTrackRegistration } from "@/hooks/useTrackRegistration";
import { Disc3, Mic2, Shield, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface TrackCreditsSheetProps {
  trackId: string | null;
  trackTitle?: string;
  trackCoverArt?: string | null;
  artist?: { id: string; display_name: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_CATEGORIES = [
  { label: "Writing & Arrangement", roles: ["writer", "songwriter", "lyricist", "composer", "arranger"] },
  { label: "Production & Engineering", roles: ["producer", "studio producer", "engineer", "mixing engineer", "mastering engineer", "recording engineer", "co-producer"] },
  { label: "Performance", roles: ["vocalist", "musician", "instrumentalist", "guitarist", "drummer", "bassist", "pianist", "keyboardist"] },
  { label: "Other", roles: [] },
];

export function TrackCreditsSheet({
  trackId,
  trackTitle,
  trackCoverArt,
  artist,
  open,
  onOpenChange,
}: TrackCreditsSheetProps) {
  const { data: trackCredits } = useQuery({
    queryKey: ["track-credits", trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from("track_credits")
        .select("*")
        .eq("track_id", trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId && open,
  });

  const { data: featureArtists } = useQuery({
    queryKey: ["track-features", trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from("track_features")
        .select("artist_id")
        .eq("track_id", trackId);
      if (error) throw error;
      if (data && data.length > 0) {
        const artistIds = data.map((f) => f.artist_id);
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("id, display_name, avatar_url")
          .in("id", artistIds);
        return profiles || [];
      }
      return [];
    },
    enabled: !!trackId && open,
  });

  const { data: registration } = useQuery({
    queryKey: ["track-registration", trackId],
    queryFn: () => fetchTrackRegistration(trackId!),
    enabled: !!trackId && open,
  });

  // Group credits by category
  const filledCategories = (() => {
    const categories = CREDIT_CATEGORIES.map((c) => ({
      ...c,
      entries: [] as { name: string; role: string }[],
    }));

    trackCredits?.forEach((credit) => {
      const roleLower = credit.role.toLowerCase();
      let placed = false;
      for (const cat of categories) {
        if (cat.roles.length > 0 && cat.roles.some((r) => roleLower.includes(r))) {
          cat.entries.push({ name: credit.name, role: credit.role });
          placed = true;
          break;
        }
      }
      if (!placed) {
        categories[categories.length - 1].entries.push({ name: credit.name, role: credit.role });
      }
    });

    return categories.filter((c) => c.entries.length > 0);
  })();

  const hasCredits = trackCredits && trackCredits.length > 0;
  const hasFeatures = featureArtists && featureArtists.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="z-[60] max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="sr-only">Track Credits</DrawerTitle>
          <DrawerDescription className="sr-only">
            Credits for {trackTitle}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-4 pb-6" style={{ maxHeight: "calc(85vh - 4rem)" }}>
          <div className="flex flex-col items-center gap-4 pb-4">
            {/* Cover Art & Track Info */}
            <div className="flex items-center gap-4 w-full">
              <div className="w-16 h-16 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                {trackCoverArt ? (
                  <img src={trackCoverArt} alt={trackTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground truncate">{trackTitle || "Unknown Track"}</h3>
                {artist && (
                  <Link
                    to={`/artist/${artist.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    {artist.display_name || "Unknown Artist"}
                  </Link>
                )}
              </div>
            </div>

            {/* Credits Section */}
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mic2 className="h-4 w-4 text-primary" />
                Credits
              </div>

              {/* Main Artist */}
              {artist && (
                <div className="glass-card p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Artist</h4>
                  <p className="text-sm text-foreground">{artist.display_name || "Unknown Artist"}</p>
                  <p className="text-xs text-muted-foreground">Main Artist</p>
                </div>
              )}

              {/* Featured Artists */}
              {hasFeatures && (
                <div className="glass-card p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Featured Artists</h4>
                  <div className="space-y-1">
                    {featureArtists.map((fa) => (
                      <div key={fa.id}>
                        <Link
                          to={`/artist/${fa.id}`}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                          onClick={() => onOpenChange(false)}
                        >
                          {fa.display_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">Featured Artist</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Credits */}
              {hasCredits && filledCategories.map((cat) => (
                <div key={cat.label} className="glass-card p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{cat.label}</h4>
                  <div className="space-y-1">
                    {cat.entries.map((entry, i) => (
                      <div key={`${entry.name}-${i}`}>
                        <p className="text-sm text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{entry.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {!hasCredits && !hasFeatures && !artist && (
                <p className="text-sm text-muted-foreground text-center py-4">No credits available for this track.</p>
              )}
            </div>

            {/* Recording Protection */}
            {registration?.recording_id && (
              <div className="w-full glass-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  Recording Protection
                </div>
                <p className="text-xs text-muted-foreground">Recording ID</p>
                <p className="text-sm font-mono text-primary font-semibold">
                  {registration.recording_id}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
