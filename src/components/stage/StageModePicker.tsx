import { Mic2, Users, Music, MessageSquare, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageMode } from "@/hooks/useStage";

interface StageModePickerProps {
  availableModes: StageMode[];
  selectedMode: StageMode | null;
  onSelect: (mode: StageMode) => void;
}

const MODE_CONFIG: Record<StageMode, { label: string; icon: typeof Mic2; description: string }> = {
  sing: { label: "Sing", icon: Mic2, description: "Sing along with lyrics" },
  rap: { label: "Rap", icon: MessageSquare, description: "Rap along to the beat" },
  duet: { label: "Duet", icon: Users, description: "Perform alongside the artist" },
  dance: { label: "Dance", icon: Music, description: "Dance or react to the beat" },
  ai_avatar: { label: "AI Avatar", icon: Bot, description: "Generate an AI avatar performance" },
};

export function StageModePicker({ availableModes, selectedMode, onSelect }: StageModePickerProps) {
  return (
    <div className="grid gap-3">
      {availableModes.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = config.icon;
        const isSelected = selectedMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
              isSelected
                ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                : "border-border bg-muted/30 hover:border-primary/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={cn("font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                {config.label} Mode
              </p>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
