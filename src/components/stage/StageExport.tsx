import { useState } from "react";
import { Download, Share2, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveStageVideo, type StageMode } from "@/hooks/useStage";
import { toast } from "sonner";

interface StageExportProps {
  recordingBlob: Blob;
  trackId: string;
  trackTitle: string;
  artistName: string;
  mode: StageMode;
  template: string;
  onDone: () => void;
  onRetry: () => void;
}

const MODE_EMOJI: Record<StageMode, string> = { sing: "🎤", duet: "🎭", dance: "💃" };
const MODE_LABELS: Record<StageMode, string> = { sing: "Sing Mode", duet: "Duet Mode", dance: "Dance Mode" };

const CAPTION_SUGGESTIONS = [
  "🎤 Performed on @JumTunes",
  "🎵 Created with JumTunes Stage",
  "🔥 New performance on JumTunes",
  "🎶 My JumTunes Stage moment",
];

export function StageExport({ recordingBlob, trackId, trackTitle, artistName, mode, template, onDone, onRetry }: StageExportProps) {
  const defaultCaption = `${MODE_EMOJI[mode]} ${MODE_LABELS[mode]} — "${trackTitle}" by ${artistName} on JumTunes!`;
  const [caption, setCaption] = useState(defaultCaption);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveMutation = useSaveStageVideo();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({ trackId, mode, videoBlob: recordingBlob, caption, template });
      toast.success("Stage video saved!");
      onDone();
    } catch {
      toast.error("Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jumtunes-stage-${mode}-${trackTitle.replace(/\s+/g, "-").toLowerCase()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const file = new File([recordingBlob], `jumtunes-stage-${mode}.webm`, { type: recordingBlob.type });
        await navigator.share({ title: `JumTunes Stage - ${trackTitle}`, text: caption, files: [file] });
      } catch { /* cancelled */ }
    } else {
      handleDownload();
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Caption copied!");
  };

  const blobUrl = URL.createObjectURL(recordingBlob);

  return (
    <div className="flex flex-col h-full bg-background p-4 space-y-5">
      <h2 className="text-xl font-bold text-foreground text-center">Your {MODE_LABELS[mode]} Recording</h2>

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {recordingBlob.type.startsWith("video/") ? (
          <video src={blobUrl} controls className="max-h-[45vh] rounded-lg border border-border" style={{ aspectRatio: "9/16", maxWidth: "100%" }} />
        ) : (
          <div className="w-full max-w-sm">
            <div className="glass-card p-8 text-center rounded-xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">{MODE_EMOJI[mode]}</span>
              </div>
              <p className="text-foreground font-medium">{trackTitle}</p>
              <p className="text-sm text-muted-foreground">by {artistName}</p>
              <audio src={blobUrl} controls className="w-full mt-4" />
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label className="text-foreground">Caption</Label>
        <div className="flex gap-2">
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-muted/50 border-border flex-1" />
          <Button variant="outline" size="icon" onClick={handleCopyCaption} className="border-border shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CAPTION_SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setCaption(s)} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="flex-1 border-border">Re-record</Button>
        <Button variant="outline" size="icon" onClick={handleDownload} className="border-border"><Download className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={handleShare} className="border-border"><Share2 className="w-4 h-4" /></Button>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-primary text-primary-foreground">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save & Share
        </Button>
      </div>
    </div>
  );
}
