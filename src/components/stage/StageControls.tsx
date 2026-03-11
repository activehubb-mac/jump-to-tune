import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic2, Users, Music, Sparkles, MessageSquare, Bot } from "lucide-react";

interface StageControlsProps {
  stageEnabled: boolean;
  onStageEnabledChange: (v: boolean) => void;
  singModeEnabled: boolean;
  onSingModeChange: (v: boolean) => void;
  duetModeEnabled: boolean;
  onDuetModeChange: (v: boolean) => void;
  danceModeEnabled: boolean;
  onDanceModeChange: (v: boolean) => void;
  rapModeEnabled: boolean;
  onRapModeChange: (v: boolean) => void;
  aiAvatarModeEnabled: boolean;
  onAiAvatarModeChange: (v: boolean) => void;
  hasKaraoke: boolean;
}

export function StageControls({
  stageEnabled, onStageEnabledChange,
  singModeEnabled, onSingModeChange,
  duetModeEnabled, onDuetModeChange,
  danceModeEnabled, onDanceModeChange,
  rapModeEnabled, onRapModeChange,
  aiAvatarModeEnabled, onAiAvatarModeChange,
  hasKaraoke,
}: StageControlsProps) {
  return (
    <div className="glass-card p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">JumTunes Stage</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Let fans create shareable performance videos with your song. Each video includes JumTunes branding and your artist attribution.
      </p>

      {/* Master toggle */}
      <div className="flex items-center justify-between py-2 border-b border-border">
        <div>
          <Label className="text-base font-medium">Enable JumTunes Stage</Label>
          <p className="text-xs text-muted-foreground">Allow fans to perform with this track</p>
        </div>
        <Switch checked={stageEnabled} onCheckedChange={onStageEnabledChange} />
      </div>

      {stageEnabled && (
        <div className="space-y-3 pl-1">
          {/* Sing Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-primary" />
              <div>
                <Label className="text-sm">Sing Mode</Label>
                {!hasKaraoke && <p className="text-xs text-yellow-500">Requires karaoke/lyrics data</p>}
              </div>
            </div>
            <Switch checked={singModeEnabled} onCheckedChange={onSingModeChange} disabled={!hasKaraoke} />
          </div>

          {/* Rap Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <Label className="text-sm">Rap Mode</Label>
            </div>
            <Switch checked={rapModeEnabled} onCheckedChange={onRapModeChange} />
          </div>

          {/* Duet Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="text-sm">Duet Mode</Label>
            </div>
            <Switch checked={duetModeEnabled} onCheckedChange={onDuetModeChange} />
          </div>

          {/* Dance Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <Label className="text-sm">Dance Mode</Label>
            </div>
            <Switch checked={danceModeEnabled} onCheckedChange={onDanceModeChange} />
          </div>

          {/* AI Avatar Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <div>
                <Label className="text-sm">AI Avatar Mode</Label>
                <p className="text-xs text-muted-foreground">Fans generate AI avatar performances (40 credits)</p>
              </div>
            </div>
            <Switch checked={aiAvatarModeEnabled} onCheckedChange={onAiAvatarModeChange} />
          </div>
        </div>
      )}
    </div>
  );
}
