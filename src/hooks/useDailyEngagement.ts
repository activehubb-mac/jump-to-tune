import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyTask {
  task_key: string;
  completed: boolean;
}

interface Engagement {
  streak_days: number;
  growth_score: number;
  last_active_date: string | null;
}

const DAILY_TASK_DEFS = [
  { key: "video", label: "Create 1 AI Video", icon: "🎬", score: 10 },
  { key: "caption", label: "Generate 1 Promo Caption", icon: "✍️", score: 5 },
  { key: "playlist", label: "Add song to Playlist", icon: "🎵", score: 2 },
];

export function useDailyEngagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["daily-tasks", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_tasks")
        .select("task_key, completed")
        .eq("user_id", user!.id)
        .eq("task_date", today);
      return (data || []) as DailyTask[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ["artist-engagement", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_engagement")
        .select("streak_days, growth_score, last_active_date")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data || { streak_days: 0, growth_score: 0, last_active_date: null }) as Engagement;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: bonusClaimed } = useQuery({
    queryKey: ["daily-bonus", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_bonus_claims")
        .select("id")
        .eq("user_id", user!.id)
        .eq("claim_date", today)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const completeTask = useMutation({
    mutationFn: async (taskKey: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("complete-daily-task", {
        body: { task_key: taskKey },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["artist-engagement"] });
      queryClient.invalidateQueries({ queryKey: ["daily-bonus"] });
      queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
    },
  });

  const taskDefs = DAILY_TASK_DEFS.map((def) => ({
    ...def,
    completed: tasks.some((t) => t.task_key === def.key && t.completed),
  }));

  const completedCount = taskDefs.filter((t) => t.completed).length;
  const allCompleted = completedCount === DAILY_TASK_DEFS.length;

  return {
    taskDefs,
    completedCount,
    allCompleted,
    bonusClaimed: bonusClaimed || false,
    engagement: engagement || { streak_days: 0, growth_score: 0, last_active_date: null },
    isLoading: tasksLoading || engagementLoading,
    completeTask: completeTask.mutate,
    isCompleting: completeTask.isPending,
  };
}
