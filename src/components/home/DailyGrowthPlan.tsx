import { useDailyEngagement } from "@/hooks/useDailyEngagement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Flame, TrendingUp, Gift, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const TASK_ROUTES: Record<string, string> = {
  video: "/ai-video",
  caption: "/ai-viral",
  playlist: "/ai-playlist",
};

export function DailyGrowthPlan() {
  const {
    taskDefs,
    completedCount,
    allCompleted,
    bonusClaimed,
    engagement,
    isLoading,
    completeTask,
    isCompleting,
  } = useDailyEngagement();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-sm">Today's Growth Plan</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/3 tasks · +5 bonus credits when complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            {engagement.streak_days > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {engagement.streak_days} Day{engagement.streak_days !== 1 ? "s" : ""}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              {engagement.growth_score}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allCompleted ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>

        {/* Task list */}
        <div className="space-y-1.5">
          {taskDefs.map((task) => (
            <button
              key={task.key}
              onClick={() => {
                if (!task.completed) {
                  navigate(TASK_ROUTES[task.key] || "/ai-tools");
                }
              }}
              disabled={task.completed || isCompleting}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                task.completed
                  ? "bg-primary/5"
                  : "hover:bg-muted/50 cursor-pointer"
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm mr-1">{task.icon}</span>
              <span
                className={cn(
                  "text-sm flex-1",
                  task.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {task.label}
              </span>
              {!task.completed && (
                <span className="text-xs text-muted-foreground">+{task.score} pts</span>
              )}
            </button>
          ))}
        </div>

        {/* Bonus status */}
        {allCompleted && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <Gift className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {bonusClaimed
                ? "🎉 +5 bonus credits claimed!"
                : "Claiming bonus credits..."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
