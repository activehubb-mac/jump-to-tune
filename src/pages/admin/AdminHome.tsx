import { useState, useEffect, useRef } from "react";
import { useAdminHomeSettings, useUpdateAdminHomeSetting } from "@/hooks/useAdminHomeSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, TrendingUp, Users, Music, X, Video, Upload, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { SpotifyEmbed } from "@/components/profile/SpotifyEmbed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GoDJBg {
  id: string;
  title: string;
  video_url: string;
  is_active: boolean;
  playback_rate: number;
  overlay_opacity: number;
}

function useGoDJBackgrounds() {
  return useQuery({
    queryKey: ["godj-backgrounds-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("godj_backgrounds")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GoDJBg[];
    },
  });
}

export default function AdminHome() {
  const { data: settings, isLoading } = useAdminHomeSettings();
  const { mutate: updateSetting, isPending } = useUpdateAdminHomeSetting();
  const queryClient = useQueryClient();

  const [newReleasesLimit, setNewReleasesLimit] = useState(6);
  const [trendingLimit, setTrendingLimit] = useState(12);
  const [discoverArtistsLimit, setDiscoverArtistsLimit] = useState(6);

  // Go DJ backgrounds
  const { data: backgrounds, isLoading: bgLoading } = useGoDJBackgrounds();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setNewReleasesLimit(settings.new_releases_limit);
      setTrendingLimit(settings.trending_limit);
      setDiscoverArtistsLimit(settings.discover_artists_limit);
    }
  }, [settings]);

  const handleUpdate = (key: Parameters<typeof updateSetting>[0]["key"], value: any) => {
    updateSetting({ key, value }, {
      onSuccess: () => toast.success("Setting updated"),
      onError: () => toast.error("Failed to update setting"),
    });
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("godj-backgrounds")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("godj-backgrounds")
        .getPublicUrl(path);

      const { error: insertErr } = await supabase
        .from("godj_backgrounds")
        .insert({ title: file.name.replace(/\.[^.]+$/, ""), video_url: urlData.publicUrl });
      if (insertErr) throw insertErr;

      queryClient.invalidateQueries({ queryKey: ["godj-backgrounds-admin"] });
      toast.success("Video uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activateBg = async (id: string) => {
    // Deactivate all, then activate selected
    const { error: e1 } = await supabase
      .from("godj_backgrounds")
      .update({ is_active: false })
      .neq("id", id);
    const { error: e2 } = await supabase
      .from("godj_backgrounds")
      .update({ is_active: true })
      .eq("id", id);
    if (e1 || e2) { toast.error("Failed to activate"); return; }
    queryClient.invalidateQueries({ queryKey: ["godj-backgrounds-admin"] });
    queryClient.invalidateQueries({ queryKey: ["godj-background-active"] });
    toast.success("Background activated");
  };

  const deleteBg = async (bg: GoDJBg) => {
    if (bg.is_active) { toast.error("Cannot delete the active background"); return; }
    // Delete from storage if it's a Supabase URL
    if (bg.video_url.includes("godj-backgrounds")) {
      const path = bg.video_url.split("/godj-backgrounds/")[1];
      if (path) await supabase.storage.from("godj-backgrounds").remove([path]);
    }
    const { error } = await supabase.from("godj_backgrounds").delete().eq("id", bg.id);
    if (error) { toast.error("Delete failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["godj-backgrounds-admin"] });
    toast.success("Deleted");
  };

  const updateBgField = async (id: string, field: string, value: number) => {
    const { error } = await supabase
      .from("godj_backgrounds")
      .update({ [field]: value })
      .eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["godj-backgrounds-admin"] });
    queryClient.invalidateQueries({ queryKey: ["godj-background-active"] });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Homepage Controls</h2>
        <p className="text-sm text-muted-foreground">Configure which sections appear on the homepage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New Releases */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">New Releases</CardTitle>
              </div>
              <Switch
                checked={settings.new_releases_enabled}
                onCheckedChange={(v) => handleUpdate("new_releases_enabled", v)}
                disabled={isPending}
              />
            </div>
            <CardDescription>Show recently uploaded tracks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Lookback Window</Label>
              <Select
                value={String(settings.new_releases_lookback_days)}
                onValueChange={(v) => handleUpdate("new_releases_lookback_days", Number(v))}
                disabled={isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Max Items: {newReleasesLimit}</Label>
              <Slider
                value={[newReleasesLimit]}
                onValueChange={(v) => setNewReleasesLimit(v[0])}
                onValueCommit={(v) => handleUpdate("new_releases_limit", v[0])}
                min={3} max={12} step={1}
                className="mt-2"
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trending */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <CardTitle className="text-base">Trending Now</CardTitle>
              </div>
              <Switch
                checked={settings.trending_enabled}
                onCheckedChange={(v) => handleUpdate("trending_enabled", v)}
                disabled={isPending}
              />
            </div>
            <CardDescription>Show trending tracks carousel</CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="text-sm">Max Items: {trendingLimit}</Label>
            <Slider
              value={[trendingLimit]}
              onValueChange={(v) => setTrendingLimit(v[0])}
              onValueCommit={(v) => handleUpdate("trending_limit", v[0])}
              min={6} max={24} step={1}
              className="mt-2"
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Discover Artists */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                <CardTitle className="text-base">Discover Artists</CardTitle>
              </div>
              <Switch
                checked={settings.discover_artists_enabled}
                onCheckedChange={(v) => handleUpdate("discover_artists_enabled", v)}
                disabled={isPending}
              />
            </div>
            <CardDescription>Show recommended artists section</CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="text-sm">Max Items: {discoverArtistsLimit}</Label>
            <Slider
              value={[discoverArtistsLimit]}
              onValueChange={(v) => setDiscoverArtistsLimit(v[0])}
              onValueCommit={(v) => handleUpdate("discover_artists_limit", v[0])}
              min={3} max={12} step={1}
              className="mt-2"
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Spotify Embed */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Spotify Embed</CardTitle>
            </div>
            <CardDescription>Show a Spotify player on the homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://open.spotify.com/playlist/..."
                value={settings.spotify_embed_uri}
                onChange={(e) => handleUpdate("spotify_embed_uri", e.target.value)}
                disabled={isPending}
              />
              {settings.spotify_embed_uri && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUpdate("spotify_embed_uri", "")}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {settings.spotify_embed_uri && (
              <div className="mt-2">
                <SpotifyEmbed url={settings.spotify_embed_uri} variant="full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Go DJ Background Management */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold">Go DJ Background</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload and manage promotional background videos for the Go DJ page</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Background Videos</CardTitle>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleUploadVideo}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Video
              </Button>
            </div>
          </div>
          <CardDescription>Only one background can be active at a time</CardDescription>
        </CardHeader>
        <CardContent>
          {bgLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !backgrounds?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No backgrounds uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {backgrounds.map((bg) => (
                <div
                  key={bg.id}
                  className={`rounded-lg border p-4 space-y-3 ${bg.is_active ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <video
                        src={bg.video_url}
                        muted
                        className="w-20 h-12 rounded object-cover bg-muted"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{bg.title}</p>
                        {bg.is_active && (
                          <span className="text-xs text-primary font-medium">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!bg.is_active && (
                        <Button size="sm" variant="outline" onClick={() => activateBg(bg.id)} className="gap-1">
                          <Check className="w-3 h-3" /> Activate
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteBg(bg)}
                        disabled={bg.is_active}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label className="text-sm">Playback Rate: {bg.playback_rate}x</Label>
                      <Slider
                        defaultValue={[bg.playback_rate]}
                        onValueCommit={(v) => updateBgField(bg.id, "playback_rate", v[0])}
                        min={0.5} max={1} step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Overlay Opacity: {bg.overlay_opacity}%</Label>
                      <Slider
                        defaultValue={[bg.overlay_opacity]}
                        onValueCommit={(v) => updateBgField(bg.id, "overlay_opacity", v[0])}
                        min={30} max={80} step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
