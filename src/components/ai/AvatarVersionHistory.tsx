import { useAvatarVersions } from "@/hooks/useAvatarVersions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, UserCheck } from "lucide-react";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { format } from "date-fns";

interface AvatarVersionHistoryProps {
  identityId: string;
  onBack: () => void;
}

const MODE_LABELS: Record<string, string> = {
  quick: "Quick Edit",
  style: "Style Shift",
  full: "Full Recreate",
  original: "Original",
};

const MODE_COLORS: Record<string, string> = {
  quick: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  style: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  full: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  original: "bg-muted text-muted-foreground border-border",
};

export function AvatarVersionHistory({ identityId, onBack }: AvatarVersionHistoryProps) {
  const { versions, isLoading, setVersionAsDefault } = useAvatarVersions(identityId);
  const { showFeedback } = useFeedbackSafe();

  const handleSetDefault = async (version: typeof versions[0]) => {
    try {
      await setVersionAsDefault(version);
      showFeedback({ type: "success", title: "Profile Updated!", message: "This version is now your default avatar.", autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Failed", message: err instanceof Error ? err.message : "Could not set version." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Editor
      </Button>

      {versions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No versions yet. Edit your avatar to create versions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <img
                src={version.avatar_url}
                alt={`Version - ${version.edit_mode}`}
                className="w-full aspect-square object-cover"
              />
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={MODE_COLORS[version.edit_mode] || MODE_COLORS.original}>
                    {MODE_LABELS[version.edit_mode] || version.edit_mode}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(version.created_at), "MMM d")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1"
                  onClick={() => handleSetDefault(version)}
                >
                  <UserCheck className="h-3 w-3" /> Set as Default
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
