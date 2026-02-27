import { useState, useEffect } from "react";
import { useAdminHomeSettings, useUpdateAdminHomeSetting } from "@/hooks/useAdminHomeSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, TrendingUp, Users, Music, X } from "lucide-react";
import { toast } from "sonner";
import { SpotifyEmbed } from "@/components/profile/SpotifyEmbed";

export default function AdminHome() {
  const { data: settings, isLoading } = useAdminHomeSettings();
  const { mutate: updateSetting, isPending } = useUpdateAdminHomeSetting();

  const [newReleasesLimit, setNewReleasesLimit] = useState(6);
  const [trendingLimit, setTrendingLimit] = useState(12);
  const [discoverArtistsLimit, setDiscoverArtistsLimit] = useState(6);

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
              <Label className="text-sm">Max Items: {settings.new_releases_limit}</Label>
              <Slider
                value={[settings.new_releases_limit]}
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
            <Label className="text-sm">Max Items: {settings.trending_limit}</Label>
            <Slider
              value={[settings.trending_limit]}
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
            <Label className="text-sm">Max Items: {settings.discover_artists_limit}</Label>
            <Slider
              value={[settings.discover_artists_limit]}
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
    </div>
  );
}
