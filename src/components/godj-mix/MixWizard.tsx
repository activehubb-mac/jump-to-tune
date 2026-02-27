import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateGoDJSession } from "@/hooks/useGoDJSessions";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Disc3, Eye, EyeOff, Sparkles, Zap } from "lucide-react";

interface MixWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MixWizard({ open, onOpenChange }: MixWizardProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [mode, setMode] = useState<"standard" | "pro">("standard");
  const navigate = useNavigate();
  const createSession = useCreateGoDJSession();

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Give your mix a name", variant: "destructive" });
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        mode,
      });
      toast({ title: "Session created!", description: "Start building your mix" });
      onOpenChange(false);
      navigate(`/go-dj/mix/${session.id}/edit`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-primary" />
            Create Session Mix
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mix-title">Title *</Label>
            <Input
              id="mix-title"
              placeholder="e.g. Friday Night Vibes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mix-desc">Description</Label>
            <Textarea
              id="mix-desc"
              placeholder="What's this mix about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {visibility === "public" ? (
                <Eye className="w-4 h-4 text-muted-foreground" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <Label>Visibility</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {visibility === "public" ? "Public" : "Unlisted"}
              </span>
              <Switch
                checked={visibility === "unlisted"}
                onCheckedChange={(v) => setVisibility(v ? "unlisted" : "public")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mix Style</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("standard")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === "standard"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Standard</span>
                </div>
                <p className="text-xs text-muted-foreground">Voice between tracks</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("pro")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === "pro"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">Pro DJ</span>
                </div>
                <p className="text-xs text-muted-foreground">Voice over music + auto-ducking</p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createSession.isPending || !title.trim()}
            className="flex-1"
          >
            {createSession.isPending ? "Creating…" : "Create Draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
