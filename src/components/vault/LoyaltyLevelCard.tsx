import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Shield, Trophy, Crown, Gem } from "lucide-react";
import { getLevelDisplayName, getNextLevel, getLevelThreshold } from "@/hooks/useFanLoyalty";

const LEVEL_ICONS: Record<string, React.ElementType> = {
  listener: Star,
  supporter: Shield,
  insider: Trophy,
  elite: Crown,
  founding_superfan: Gem,
};

const ALL_LEVELS = ["listener", "supporter", "insider", "elite", "founding_superfan"];

interface LoyaltyLevelCardProps {
  points: number;
  level: string;
  artistName?: string;
}

export function LoyaltyLevelCard({ points, level, artistName }: LoyaltyLevelCardProps) {
  const currentIdx = ALL_LEVELS.indexOf(level);
  const next = getNextLevel(level);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {artistName ? `Loyalty with ${artistName}` : "Loyalty Progress"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{points} total points</p>

      <div className="flex items-center gap-1 mb-4">
        {ALL_LEVELS.map((lvl, idx) => {
          const Icon = LEVEL_ICONS[lvl];
          const isActive = idx <= currentIdx;
          return (
            <div key={lvl} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? "bg-primary/20" : "bg-muted/30"}`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
              </div>
              <span className={`text-[9px] text-center ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                {getLevelDisplayName(lvl)}
              </span>
            </div>
          );
        })}
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{points} pts</span>
            <span>{next.points} pts</span>
          </div>
          <Progress value={Math.min(((points - getLevelThreshold(level)) / (next.points - getLevelThreshold(level))) * 100, 100)} className="h-2" />
        </div>
      )}
      {!next && (
        <Badge className="bg-primary/20 text-primary border-primary/30">Max Level Reached!</Badge>
      )}
    </div>
  );
}
