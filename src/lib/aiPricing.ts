export interface PricingTier {
  label: string;
  credits: number;
}

export interface ToolPricing {
  label: string;
  base: number;
  tiers?: PricingTier[];
}

export const AI_TOOL_PRICING: Record<string, ToolPricing> = {
  playlist_builder: { label: "AI Playlist Builder", base: 5 },
  release_builder: { label: "AI Release Builder", base: 10 },
  cover_art: { label: "Cover Art Generator", base: 10 },
  identity_builder: {
    label: "AI Identity Builder",
    base: 15,
    tiers: [
      { label: "Vision mode", credits: 15 },
      { label: "Photo recreate", credits: 25 },
      { label: "HD recreate", credits: 40 },
    ],
  },
  video_studio: {
    label: "AI Video Studio",
    base: 130,
    tiers: [
      { label: "10s (480p)", credits: 130 },
      { label: "15s (480p)", credits: 180 },
      { label: "20s (480p)", credits: 240 },
      { label: "HD (720p)", credits: 400 },
    ],
  },
  viral_generator: {
    label: "AI Viral Generator",
    base: 500,
    tiers: [
      { label: "3 Clips", credits: 500 },
      { label: "5 Clips", credits: 850 },
    ],
  },
  identity_motion: {
    label: "Avatar Video",
    base: 0,
    tiers: [
      { label: "Basic (Live Preview)", credits: 0 },
      { label: "Video (10s 480p)", credits: 130 },
      { label: "HD Video (720p)", credits: 400 },
    ],
  },
};

export function getToolCost(key: string): number {
  return AI_TOOL_PRICING[key]?.base ?? 0;
}

export function getToolTiers(key: string): PricingTier[] {
  return AI_TOOL_PRICING[key]?.tiers ?? [];
}
