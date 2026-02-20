import { Badge } from "@/components/ui/badge";
import { Gem, Music } from "lucide-react";

interface Purchase {
  id: string;
  edition_number: number;
  track?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    total_editions: number;
    artist?: { id: string; display_name: string | null };
  } | null;
}

interface LimitedEditionsProps {
  purchases: Purchase[];
}

export function LimitedEditions({ purchases }: LimitedEditionsProps) {
  const limited = purchases.filter(
    (p) => p.track && p.track.total_editions <= 1000
  );

  if (limited.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Limited Editions</h2>
      </div>
      <div className="space-y-3">
        {limited.map((purchase) => (
          <div key={purchase.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-glass-border">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted/50 shrink-0">
              {purchase.track?.cover_art_url ? (
                <img src={purchase.track.cover_art_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-muted-foreground/50" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{purchase.track?.title}</p>
              <p className="text-sm text-muted-foreground truncate">{purchase.track?.artist?.display_name}</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
              Edition {purchase.edition_number} of {purchase.track?.total_editions}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
