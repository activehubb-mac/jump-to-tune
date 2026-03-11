import { cn } from "@/lib/utils";

export type AvatarStyle = "cyber_dj" | "anime_performer" | "robot_artist" | "hologram_singer" | "street_rapper";
export type SceneBackground = "concert_stage" | "cyber_club" | "neon_city" | "festival_stage";

interface AvatarStylePickerProps {
  selectedStyle: AvatarStyle;
  onStyleChange: (s: AvatarStyle) => void;
  selectedScene: SceneBackground;
  onSceneChange: (s: SceneBackground) => void;
}

const AVATAR_STYLES: { id: AvatarStyle; label: string; emoji: string }[] = [
  { id: "cyber_dj", label: "Cyber DJ", emoji: "🤖" },
  { id: "anime_performer", label: "Anime Performer", emoji: "🎌" },
  { id: "robot_artist", label: "Robot Artist", emoji: "⚙️" },
  { id: "hologram_singer", label: "Hologram Singer", emoji: "✨" },
  { id: "street_rapper", label: "Street Rapper", emoji: "🎤" },
];

const SCENE_BACKGROUNDS: { id: SceneBackground; label: string; gradient: string }[] = [
  { id: "concert_stage", label: "Concert Stage", gradient: "from-orange-900 via-red-900 to-amber-900" },
  { id: "cyber_club", label: "Cyber Club", gradient: "from-cyan-900 via-blue-900 to-indigo-900" },
  { id: "neon_city", label: "Neon City", gradient: "from-purple-900 via-pink-900 to-fuchsia-900" },
  { id: "festival_stage", label: "Festival Stage", gradient: "from-green-900 via-emerald-900 to-teal-900" },
];

export function AvatarStylePicker({ selectedStyle, onStyleChange, selectedScene, onSceneChange }: AvatarStylePickerProps) {
  return (
    <div className="space-y-5">
      {/* Avatar Style */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Avatar Style</p>
        <div className="grid grid-cols-2 gap-2">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStyleChange(s.id)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border transition-all text-left text-sm",
                selectedStyle === s.id
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                  : "border-border bg-muted/30 hover:border-primary/50"
              )}
            >
              <span className="text-xl">{s.emoji}</span>
              <span className={cn("font-medium", selectedStyle === s.id ? "text-primary" : "text-foreground")}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scene Background */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Background Scene</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SCENE_BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onSceneChange(bg.id)}
              className={cn(
                "flex-shrink-0 w-24 h-16 rounded-lg bg-gradient-to-br flex items-center justify-center text-xs font-medium text-white border-2 transition-all",
                bg.gradient,
                selectedScene === bg.id ? "border-primary shadow-lg shadow-primary/30 scale-105" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {bg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getAvatarPrompt(style: AvatarStyle, scene: SceneBackground): { avatarPrompt: string; scenePrompt: string } {
  const avatarPrompts: Record<AvatarStyle, string> = {
    cyber_dj: "a futuristic cyberpunk DJ character with glowing neon headphones and visor, performing behind turntables",
    anime_performer: "an anime-style music performer with dramatic hair and sparkling eyes, singing passionately on stage",
    robot_artist: "a sleek humanoid robot musician with chrome body and LED displays, playing music with mechanical precision",
    hologram_singer: "a translucent holographic singer made of shimmering light particles, floating and performing",
    street_rapper: "an urban street rapper character with stylish streetwear, gold chains, performing with confident energy",
  };
  const scenePrompts: Record<SceneBackground, string> = {
    concert_stage: "on a grand concert stage with dramatic spotlights, pyrotechnics, and a massive crowd",
    cyber_club: "inside a futuristic cyber nightclub with neon lights, holographic displays, and LED walls",
    neon_city: "in a neon-lit cyberpunk cityscape at night with glowing signs and rain-slicked streets",
    festival_stage: "on an outdoor music festival main stage with colorful lights, lasers, and festival crowd",
  };
  return { avatarPrompt: avatarPrompts[style], scenePrompt: scenePrompts[scene] };
}
