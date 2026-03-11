import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Search, User, Music, Sparkles } from "lucide-react";
import {
  useAdminAvatarPromotions,
  useCreateAvatarPromotion,
  useUpdateAvatarPromotion,
  useDeleteAvatarPromotion,
} from "@/hooks/useAvatarPromotions";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EXPOSURE_ZONES = [
  { value: "home", label: "Home Page" },
  { value: "discovery", label: "Browse / Discovery" },
  { value: "global", label: "Global (All Pages)" },
];

export default function AdminAvatarPromotions() {
  const { user } = useAuth();
  const { data: promotions, isLoading } = useAdminAvatarPromotions();
  const createMutation = useCreateAvatarPromotion();
  const updateMutation = useUpdateAvatarPromotion();
  const deleteMutation = useDeleteAvatarPromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackSearch, setTrackSearch] = useState("");

  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [exposureZone, setExposureZone] = useState("global");

  const { data: artists, isLoading: artistsLoading } = useArtists({ searchQuery: searchQuery || undefined });
  const { data: tracks, isLoading: tracksLoading } = useTracks({
    publishedOnly: true,
    searchQuery: trackSearch || undefined,
    limit: 30,
  });

  const activeCount = promotions?.filter((p) => p.is_active).length || 0;

  const handleCreate = async () => {
    if (!selectedArtistId || !user) return;
    try {
      await createMutation.mutateAsync({
        artist_id: selectedArtistId,
        track_id: selectedTrackId || undefined,
        promotion_type: "floating",
        animation_type: "perform",
        exposure_zone: exposureZone,
        created_by: user.id,
      });
      toast.success("Avatar promotion created");
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create promotion");
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    if (!currentState && activeCount >= 3) {
      toast.error("Max 3 simultaneous active promotions allowed");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, is_active: !currentState });
      toast.success(currentState ? "Promotion deactivated" : "Promotion activated");
    } catch {
      toast.error("Failed to update promotion");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Promotion deleted");
    } catch {
      toast.error("Failed to delete promotion");
    }
  };

  const resetForm = () => {
    setSelectedArtistId("");
    setSelectedTrackId("");
    setExposureZone("global");
    setSearchQuery("");
    setTrackSearch("");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold">Avatar Promotions</h2>
            <p className="text-xs text-muted-foreground">
              {activeCount}/3 active · Background slideshow on Home & Browse pages
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[92vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Avatar Promotion</DialogTitle>
              <DialogDescription>
                Feature an artist in the background slideshow on Home & Browse pages
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Artist Selection */}
              <div className="space-y-2">
                <Label>Artist *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search artists..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-1.5 space-y-1">
                  {artistsLoading ? (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                  ) : artists && artists.length > 0 ? (
                    artists.map((a) => (
                      <button key={a.id} onClick={() => setSelectedArtistId(a.id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-colors text-left ${selectedArtistId === a.id ? "bg-primary/15 border border-primary/40" : "hover:bg-muted"}`}>
                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                          {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-muted-foreground" />}
                        </div>
                        <span className="text-sm font-medium truncate">{a.display_name || "Unknown"}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">No artists found</p>
                  )}
                </div>
              </div>

              {/* Track (optional) */}
              <div className="space-y-2">
                <Label>Linked Song (optional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search tracks..." className="pl-9" value={trackSearch} onChange={(e) => setTrackSearch(e.target.value)} />
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-1.5 space-y-1">
                  {tracksLoading ? (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                  ) : tracks && tracks.length > 0 ? (
                    tracks.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTrackId(selectedTrackId === t.id ? "" : t.id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-colors text-left ${selectedTrackId === t.id ? "bg-primary/15 border border-primary/40" : "hover:bg-muted"}`}>
                        <div className="w-8 h-8 rounded-md bg-muted overflow-hidden shrink-0">
                          {t.cover_art_url ? <img src={t.cover_art_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-full h-full p-1.5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{t.artist?.display_name}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">No tracks found</p>
                  )}
                </div>
              </div>

              {/* Exposure Zone */}
              <div className="space-y-1.5">
                <Label className="text-xs">Exposure Zone</Label>
                <Select value={exposureZone} onValueChange={setExposureZone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPOSURE_ZONES.map((z) => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleCreate} disabled={!selectedArtistId || createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !promotions || promotions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No avatar promotions yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id} className={`transition-colors ${promo.is_active ? "border-primary/30" : ""}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0 border-2 border-primary/20">
                    {promo.artist?.avatar_url ? (
                      <img src={promo.artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2.5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{promo.artist?.display_name || "Unknown Artist"}</p>
                      {promo.is_active && <Badge variant="default" className="text-[10px] px-1.5 py-0">LIVE</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {EXPOSURE_ZONES.find((z) => z.value === promo.exposure_zone)?.label || promo.exposure_zone}
                      </Badge>
                    </div>
                    {promo.track && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        🎵 {promo.track.title}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={promo.is_active}
                      onCheckedChange={() => handleToggle(promo.id, promo.is_active)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
