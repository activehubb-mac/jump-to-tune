import { useActivityFeed } from "@/hooks/useActivityFeed";
import { Loader2, Music, Gem, Star, Package, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  new_drop: { icon: Music, color: "text-primary" },
  limited_release: { icon: Gem, color: "text-yellow-500" },
  superfan_exclusive: { icon: Star, color: "text-purple-500" },
  merch_restock: { icon: Package, color: "text-green-500" },
  announcement: { icon: Megaphone, color: "text-blue-500" },
};

export function ActivityFeed({ artistId }: { artistId: string }) {
  const { entries, isLoading } = useActivityFeed(artistId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.announcement;
        const Icon = config.icon;
        return (
          <div key={entry.id} className="glass-card p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{entry.title}</p>
              {entry.description && <p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>}
              <p className="text-xs text-muted-foreground/60 mt-1">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
