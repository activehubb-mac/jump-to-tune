import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopSupporter } from "@/hooks/useTopSupporters";

interface TopSupportersProps {
  supporters: TopSupporter[];
  currentUserId: string | undefined;
}

export function TopSupporters({ supporters, currentUserId }: TopSupportersProps) {
  if (supporters.length === 0) return null;

  const currentUserRank = currentUserId
    ? supporters.findIndex((s) => s.user_id === currentUserId)
    : -1;

  return (
    <div className="glass-card-bordered p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Top Supporters This Month</h3>
      </div>
      <div className="flex items-center gap-4">
        {supporters.map((supporter, i) => (
          <div key={supporter.user_id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold">#{i + 1}</span>
            <Avatar className="w-7 h-7">
              <AvatarImage src={supporter.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">
                {(supporter.display_name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-foreground font-medium truncate max-w-[80px]">
                {supporter.display_name || "Supporter"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${supporter.total_spent.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {currentUserRank >= 0 && (
        <p className="text-xs text-primary mt-2">You're #{currentUserRank + 1} this month!</p>
      )}
    </div>
  );
}
