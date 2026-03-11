import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Flag, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StageVideo } from "@/hooks/useStage";

export function AdminStageTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "featured" | "flagged">("all");

  const { data: videos = [], isLoading } = useQuery<StageVideo[]>({
    queryKey: ["admin-stage-videos", filter],
    queryFn: async () => {
      let query = supabase
        .from("stage_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filter === "featured") query = query.eq("is_featured", true);
      if (filter === "flagged") query = query.eq("is_moderated", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StageVideo[];
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("stage_videos").update({ is_featured: featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-stage-videos"] }); toast.success("Updated"); },
  });

  const toggleModerated = useMutation({
    mutationFn: async ({ id, moderated }: { id: string; moderated: boolean }) => {
      const { error } = await supabase.from("stage_videos").update({ is_moderated: moderated }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-stage-videos"] }); toast.success("Updated"); },
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stage_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-stage-videos"] }); toast.success("Deleted"); },
  });

  const MODE_COLORS: Record<string, string> = { sing: "bg-purple-500/20 text-purple-400", duet: "bg-cyan-500/20 text-cyan-400", dance: "bg-pink-500/20 text-pink-400" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> JumTunes Stage Videos
        </h3>
        <div className="flex gap-2">
          {(["all", "featured", "flagged"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className={filter === f ? "bg-primary text-primary-foreground" : "border-border"}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No stage videos found</p>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="glass-card p-4 flex items-center gap-4">
              {video.video_url && <video src={video.video_url} className="w-16 h-28 rounded object-cover bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{video.caption_text || "No caption"}</p>
                <p className="text-xs text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</p>
                <div className="flex gap-1 mt-1">
                  <Badge className={`text-xs ${MODE_COLORS[video.mode] || ""}`}>{video.mode}</Badge>
                  {video.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {video.is_moderated && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => toggleFeatured.mutate({ id: video.id, featured: !video.is_featured })}>
                  <Star className={`w-4 h-4 ${video.is_featured ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => toggleModerated.mutate({ id: video.id, moderated: !video.is_moderated })}>
                  <Flag className={`w-4 h-4 ${video.is_moderated ? "text-destructive" : "text-muted-foreground"}`} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteVideo.mutate(video.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
