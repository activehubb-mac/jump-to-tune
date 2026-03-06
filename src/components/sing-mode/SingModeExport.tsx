import { useState } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveSingVideo } from "@/hooks/useSingMode";
import { toast } from "sonner";

interface SingModeExportProps {
  recordingBlob: Blob;
  trackId: string;
  trackTitle: string;
  onDone: () => void;
  onRetry: () => void;
}

type ExportFormat = "tiktok" | "reels" | "shorts";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  tiktok: "TikTok (9:16)",
  reels: "Instagram Reel (9:16)",
  shorts: "YouTube Shorts (9:16)",
};

export function SingModeExport({
  recordingBlob,
  trackId,
  trackTitle,
  onDone,
  onRetry,
}: SingModeExportProps) {
  const [caption, setCaption] = useState(`🎤 Singing "${trackTitle}" on JumTunes!`);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("tiktok");
  const [isSaving, setIsSaving] = useState(false);
  const saveMutation = useSaveSingVideo();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        trackId,
        videoBlob: recordingBlob,
        caption,
      });
      toast.success("Sing Mode video saved!");
      onDone();
    } catch (err) {
      toast.error("Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sing-mode-${trackTitle.replace(/\s+/g, "-").toLowerCase()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const file = new File([recordingBlob], "sing-mode.webm", {
          type: recordingBlob.type,
        });
        await navigator.share({
          title: `Sing Mode - ${trackTitle}`,
          text: caption,
          files: [file],
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleDownload();
    }
  };

  const blobUrl = URL.createObjectURL(recordingBlob);

  return (
    <div className="flex flex-col h-full bg-background p-4 space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">Your Recording</h2>

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {recordingBlob.type.startsWith("video/") ? (
          <video
            src={blobUrl}
            controls
            className="max-h-[50vh] rounded-lg border border-border"
            style={{ aspectRatio: "9/16", maxWidth: "100%" }}
          />
        ) : (
          <div className="w-full max-w-sm">
            <div className="glass-card p-8 text-center rounded-xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🎤</span>
              </div>
              <p className="text-foreground font-medium">{trackTitle}</p>
              <audio src={blobUrl} controls className="w-full mt-4" />
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label className="text-foreground">Caption</Label>
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="bg-muted/50 border-border"
        />
      </div>

      {/* Format selection */}
      <div className="space-y-2">
        <Label className="text-foreground">Export Format</Label>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(FORMAT_LABELS) as [ExportFormat, string][]).map(
            ([key, label]) => (
              <Button
                key={key}
                variant={selectedFormat === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFormat(key)}
                className={
                  selectedFormat === key
                    ? "bg-primary text-primary-foreground"
                    : "border-border"
                }
              >
                {label}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="flex-1 border-border">
          Re-record
        </Button>
        <Button variant="outline" onClick={handleDownload} className="border-border">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={handleShare} className="border-border">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-primary text-primary-foreground"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save & Share
        </Button>
      </div>
    </div>
  );
}
