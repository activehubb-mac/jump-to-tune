import { ExternalLink } from "lucide-react";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "tiktok", label: "TikTok", icon: "🎵" },
  { key: "youtube", label: "YouTube", icon: "▶️" },
  { key: "spotify", label: "Spotify", icon: "🎧" },
  { key: "apple_music", label: "Apple Music", icon: "🍎" },
  { key: "soundcloud", label: "SoundCloud", icon: "☁️" },
  { key: "website", label: "Website", icon: "🌐" },
  { key: "shopify", label: "Shopify", icon: "🛍️" },
  { key: "booking", label: "Booking", icon: "📅" },
  { key: "custom", label: "Custom Link", icon: "🔗" },
] as const;

interface SocialLinksSectionProps {
  socialLinks: Record<string, string> | null;
  isVerified?: boolean;
}

export function SocialLinksSection({ socialLinks, isVerified }: SocialLinksSectionProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No links added yet.</p>
      </div>
    );
  }

  const activeLinks = PLATFORMS.filter((p) => socialLinks[p.key]?.trim());

  if (activeLinks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No links added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeLinks.map((platform) => (
        <a
          key={platform.key}
          href={socialLinks[platform.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-4 flex items-center gap-4 hover:bg-primary/5 transition-all duration-200 group"
        >
          <span className="text-2xl">{platform.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground flex items-center gap-2">
              {platform.label}
              {isVerified && (
                <span className="text-xs text-primary">✓</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {socialLinks[platform.key]}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
}

export { PLATFORMS };
