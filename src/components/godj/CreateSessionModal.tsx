import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Music, Link as LinkIcon, Loader2, Search, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateDJSession } from "@/hooks/useDJSessions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrackItem {
  id: string;
  type: "jumtunes" | "spotify" | "apple_music" | "youtube";
  title: string;
  trackId?: string;
  embedUrl?: string;
}

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  maxSlots: number;
}

export function CreateSessionModal({ open, onOpenChange, activeCount, maxSlots }: CreateSessionModalProps) {
  const { user } = useAuth();
  const createSession = useCreateDJSession();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Track search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Embed state
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedType, setEmbedType] = useState<"spotify" | "apple_music" | "youtube">("spotify");

  const handleCoverSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image must be under 10MB");
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const searchTracks = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const { data } = await supabase
      .from("tracks")
      .select("id, title, artist_id, cover_art_url")
      .ilike("title", `%${q}%`)
      .limit(8);
    setSearchResults(data || []);
    setIsSearching(false);
  }, []);

  const addJumTunesTrack = (track: any) => {
    if (tracks.some(t => t.trackId === track.id)) return;
    setTracks(prev => [...prev, {
      id: crypto.randomUUID(),
      type: "jumtunes",
      title: track.title,
      trackId: track.id,
    }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const addEmbed = () => {
    if (!embedUrl.trim()) return;
    setTracks(prev => [...prev, {
      id: crypto.randomUUID(),
      type: embedType,
      title: embedUrl.substring(0, 60),
      embedUrl: embedUrl.trim(),
    }]);
    setEmbedUrl("");
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const handlePublish = async () => {
    if (!title.trim() || !user) return;
    setIsPublishing(true);

    try {
      let coverUrl: string | null = null;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `dj-sessions/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(path, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      const session = await createSession.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverUrl || undefined,
      });

      // Insert tracks
      if (tracks.length > 0 && session?.id) {
        const trackRows = tracks.map((t, i) => ({
          session_id: session.id,
          track_id: t.trackId || null,
          embed_url: t.embedUrl || null,
          embed_type: t.type,
          position: i,
        }));
        const { error: trackError } = await supabase
          .from("dj_session_tracks")
          .insert(trackRows);
        if (trackError) throw trackError;
      }

      queryClient.invalidateQueries({ queryKey: ["dj-sessions"] });
      toast.success("Session published!");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCoverFile(null);
    setCoverPreview(null);
    setTracks([]);
    setSearchQuery("");
    setEmbedUrl("");
  };

  const slotsLeft = maxSlots - activeCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Session
            <Badge variant="secondary" className="text-xs">
              {activeCount}/{maxSlots} slots used
            </Badge>
          </DialogTitle>
          <DialogDescription>Build your curated DJ session.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="session-title">Title *</Label>
            <Input
              id="session-title"
              placeholder="My session name..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverPreview ? (
              <div className="flex items-center gap-3">
                <img src={coverPreview} alt="Cover" className="w-20 h-20 rounded-lg object-cover" />
                <Button variant="ghost" size="sm" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                <Image className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload cover art (PNG, JPG up to 10MB)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverSelect} />
              </label>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="session-desc">Description</Label>
            <Textarea
              id="session-desc"
              placeholder="What's this session about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Add Tracks */}
          <div className="space-y-3">
            <Label>Tracks</Label>

            {/* JumTunes search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search JumTunes tracks..."
                className="pl-9"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); searchTracks(e.target.value); }}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map(t => (
                    <button
                      key={t.id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 flex items-center gap-2 transition-colors"
                      onClick={() => addJumTunesTrack(t)}
                    >
                      {t.cover_art_url ? (
                        <img src={t.cover_art_url} className="w-8 h-8 rounded object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                      <span className="truncate text-foreground">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Embed URL */}
            <div className="flex gap-2">
              <Select value={embedType} onValueChange={(v: any) => setEmbedType(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="apple_music">Apple Music</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Paste embed URL..."
                value={embedUrl}
                onChange={e => setEmbedUrl(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addEmbed} disabled={!embedUrl.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Track List */}
            {tracks.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {tracks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    {t.type === "jumtunes" ? (
                      <Music className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm text-foreground truncate flex-1">{t.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{t.type}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTrack(t.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handlePublish}
            disabled={!title.trim() || isPublishing || slotsLeft <= 0}
          >
            {isPublishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : "Publish Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
