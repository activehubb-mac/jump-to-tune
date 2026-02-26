import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Music, Link as LinkIcon, Loader2, Search, Image, Disc3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateDJSession } from "@/hooks/useDJSessions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeSpotifyUrl } from "@/lib/spotifyUtils";

interface TrackItem {
  id: string;
  type: "jumtunes";
  title: string;
  trackId: string;
  coverUrl?: string | null;
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

  // Step: "type" | "details" | "content"
  const [step, setStep] = useState<"type" | "details" | "content">("type");
  const [sessionType, setSessionType] = useState<"jumtunes" | "spotify">("jumtunes");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // JumTunes tracks
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Spotify
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

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
      .select("id, title, artist_id, cover_art_url, audio_url")
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
      coverUrl: track.cover_art_url,
    }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleSpotifyPaste = (url: string) => {
    setSpotifyUrl(url);
    setSpotifyError(null);
    if (!url.trim()) {
      setSpotifyEmbedUrl(null);
      return;
    }
    const embed = normalizeSpotifyUrl(url);
    if (embed) {
      setSpotifyEmbedUrl(embed);
    } else {
      setSpotifyEmbedUrl(null);
      setSpotifyError("Invalid Spotify URL. Paste a playlist, album, or track link.");
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !user) return;
    if (sessionType === "jumtunes" && tracks.length === 0) {
      toast.error("Add at least one track");
      return;
    }
    if (sessionType === "spotify" && !spotifyEmbedUrl) {
      toast.error("Paste a valid Spotify link");
      return;
    }

    setIsPublishing(true);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `dj-sessions/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("covers").upload(path, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      const session = await createSession.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverUrl || undefined,
        session_type: sessionType,
      });

      if (!session?.id) throw new Error("Session creation failed");

      if (sessionType === "jumtunes" && tracks.length > 0) {
        const trackRows = tracks.map((t, i) => ({
          session_id: session.id,
          track_id: t.trackId,
          embed_type: "jumtunes",
          position: i,
        }));
        const { error: trackError } = await supabase.from("dj_session_tracks").insert(trackRows);
        if (trackError) throw trackError;
      }

      if (sessionType === "spotify" && spotifyEmbedUrl) {
        const { error: spotifyError } = await (supabase as any).from("dj_session_spotify").insert({
          session_id: session.id,
          spotify_url_raw: spotifyUrl.trim(),
          spotify_embed_url: spotifyEmbedUrl,
        });
        if (spotifyError) throw spotifyError;
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
    setStep("type");
    setSessionType("jumtunes");
    setTitle("");
    setDescription("");
    setCoverFile(null);
    setCoverPreview(null);
    setTracks([]);
    setSearchQuery("");
    setSearchResults([]);
    setSpotifyUrl("");
    setSpotifyEmbedUrl(null);
    setSpotifyError(null);
  };

  const slotsLeft = maxSlots - activeCount;

  const canProceedFromType = true;
  const canProceedFromDetails = title.trim().length > 0;
  const canPublish = sessionType === "jumtunes" ? tracks.length > 0 : !!spotifyEmbedUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Session
            <Badge variant="secondary" className="text-xs">
              {activeCount}/{maxSlots} slots used
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {step === "type" && "Choose your session type."}
            {step === "details" && "Add session info."}
            {step === "content" && (sessionType === "jumtunes" ? "Add JumTunes tracks." : "Paste your Spotify link.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Type Selection */}
        {step === "type" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSessionType("jumtunes")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  sessionType === "jumtunes"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Music className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold text-foreground">JumTunes Session</h4>
                <p className="text-xs text-muted-foreground mt-1">Curate and play JumTunes tracks</p>
              </button>
              <button
                onClick={() => setSessionType("spotify")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  sessionType === "spotify"
                    ? "border-[hsl(141,73%,42%)] bg-[hsl(141,73%,42%)]/10"
                    : "border-border hover:border-[hsl(141,73%,42%)]/40"
                }`}
              >
                <Disc3 className="w-10 h-10 mx-auto mb-3 text-[hsl(141,73%,42%)]" />
                <h4 className="font-semibold text-foreground">Spotify Session</h4>
                <p className="text-xs text-muted-foreground mt-1">Embed a Spotify playlist, album, or track</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Session Details */}
        {step === "details" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="session-title">Title *</Label>
              <Input id="session-title" placeholder="My session name..." value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="session-desc">Description</Label>
              <Textarea id="session-desc" placeholder="What's this session about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={500} />
            </div>
          </div>
        )}

        {/* Step 3: Content */}
        {step === "content" && sessionType === "jumtunes" && (
          <div className="space-y-4">
            <Label>Add JumTunes Tracks</Label>
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

            {tracks.length > 0 && (
              <div className="space-y-1.5">
                {tracks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <Music className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{t.title}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTrack(t.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "content" && sessionType === "spotify" && (
          <div className="space-y-4">
            <Label>Paste Spotify Link</Label>
            <Input
              placeholder="https://open.spotify.com/playlist/..."
              value={spotifyUrl}
              onChange={e => handleSpotifyPaste(e.target.value)}
            />
            {spotifyError && (
              <p className="text-sm text-destructive">{spotifyError}</p>
            )}
            {spotifyEmbedUrl && (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2">
          {step !== "type" && (
            <Button variant="outline" onClick={() => setStep(step === "content" ? "details" : "type")}>
              Back
            </Button>
          )}
          {step === "type" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStep("details")} disabled={!canProceedFromType}>
                Next
              </Button>
            </>
          )}
          {step === "details" && (
            <Button onClick={() => setStep("content")} disabled={!canProceedFromDetails}>
              Next
            </Button>
          )}
          {step === "content" && (
            <Button onClick={handlePublish} disabled={!canPublish || isPublishing || slotsLeft <= 0}>
              {isPublishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : "Publish Session"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
