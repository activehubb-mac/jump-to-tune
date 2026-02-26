import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateDJSession } from "@/hooks/useDJSessions";
import { toast } from "sonner";
import type { DJSession } from "@/hooks/useDJSessions";

interface EditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: DJSession;
}

export function EditSessionModal({ open, onOpenChange, session }: EditSessionModalProps) {
  const { user } = useAuth();
  const updateSession = useUpdateDJSession();

  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || "");
  const [status, setStatus] = useState(session.status);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(session.cover_image_url);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(session.title);
      setDescription(session.description || "");
      setStatus(session.status);
      setCoverFile(null);
      setCoverPreview(session.cover_image_url);
    }
  }, [open, session]);

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

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setIsSaving(true);
    try {
      let coverUrl = session.cover_image_url;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `dj-sessions/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("covers").upload(path, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      await updateSession.mutateAsync({
        id: session.id,
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: coverUrl,
        status,
      });

      toast.success("Session updated!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update session");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>Update your Go DJ session details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
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
                <span className="text-sm text-muted-foreground">Upload cover art</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverSelect} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={500} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
