import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mic2, Flag, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SingModeVideo {
  id: string;
  user_id: string;
  track_id: string;
  video_url: string | null;
  caption_text: string | null;
  status: string;
  is_featured: boolean;
  is_moderated: boolean;
  created_at: string;
}

export function AdminSingModeTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "featured" | "flagged">("all");

  const { data: videos = [], isLoading } = useQuery<SingModeVideo[]>({
    queryKey: ["admin-sing-videos", filter],
    queryFn: async () => {
      let query = supabase
        .from("sing_mode_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter === "featured") query = query.eq("is_featured", true);
      if (filter === "flagged") query = query.eq("is_moderated", true);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase
        .from("sing_mode_videos")
        .update({ is_featured: featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sing-videos"] });
      toast.success("Updated");
    },
  });

  const toggleModerated = useMutation({
    mutationFn: async ({ id, moderated }: { id: string; moderated: boolean }) => {
      const { error } = await supabase
        .from("sing_mode_videos")
        .update({ is_moderated: moderated })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sing-videos"] });
      toast.success("Updated");
    },
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sing_mode_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sing-videos"] });
      toast.success("Video deleted");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Mic2 className="w-5 h-5 text-primary" />
          Sing Mode Videos
        </h3>
        <div className="flex gap-2">
          {(["all", "featured", "flagged"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-primary text-primary-foreground" : "border-border"}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No videos found</p>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="glass-card p-4 flex items-center gap-4"
            >
              {video.video_url && (
                <video
                  src={video.video_url}
                  className="w-16 h-28 rounded object-cover bg-muted"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {video.caption_text || "No caption"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(video.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-1 mt-1">
                  {video.is_featured && (
                    <Badge variant="secondary" className="text-xs">Featured</Badge>
                  )}
                  {video.is_moderated && (
                    <Badge variant="destructive" className="text-xs">Flagged</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    toggleFeatured.mutate({
                      id: video.id,
                      featured: !video.is_featured,
                    })
                  }
                  title={video.is_featured ? "Remove from featured" : "Feature"}
                >
                  <Star
                    className={`w-4 h-4 ${video.is_featured ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    toggleModerated.mutate({
                      id: video.id,
                      moderated: !video.is_moderated,
                    })
                  }
                  title={video.is_moderated ? "Unflag" : "Flag as inappropriate"}
                >
                  <Flag
                    className={`w-4 h-4 ${video.is_moderated ? "text-destructive" : "text-muted-foreground"}`}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteVideo.mutate(video.id)}
                  title="Delete"
                >
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
