import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Shield, Crown, Gem } from "lucide-react";
import { getLevelDisplayName, getNextLevel, getLevelThreshold } from "@/hooks/useFanLoyalty";

const LEVEL_ICONS: Record<string, React.ElementType> = {
  listener: Star,
  supporter: Shield,
  insider: Trophy,
  elite: Crown,
  founding_superfan: Gem,
};

interface VaultHeaderProps {
  totalPoints: number;
  highestLevel: string;
  tracksOwned: number;
  customLevelNames?: Record<string, string> | null;
}

export function VaultHeader({ totalPoints, highestLevel, tracksOwned, customLevelNames }: VaultHeaderProps) {
  const LevelIcon = LEVEL_ICONS[highestLevel] || Star;
  const levelName = getLevelDisplayName(highestLevel, customLevelNames);
  const next = getNextLevel(highestLevel);
  const currentThreshold = getLevelThreshold(highestLevel);
  const nextThreshold = next?.points ?? currentThreshold;
  const progress = next ? ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <LevelIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">My Vault</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">{levelName}</Badge>
            <span className="text-sm text-muted-foreground">{totalPoints} pts</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{tracksOwned}</p>
          <p className="text-xs text-muted-foreground">Tracks Owned</p>
        </div>
      </div>
      {next && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{levelName}</span>
            <span>{getLevelDisplayName(next.level, customLevelNames)} ({next.points} pts)</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{next.points - totalPoints} points to next level</p>
        </div>
      )}
    </div>
  );
}
