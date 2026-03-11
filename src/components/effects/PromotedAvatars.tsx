import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useActiveAvatarPromotions, type AvatarPromotion } from "@/hooks/useAvatarPromotions";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";

/** Map current route to exposure zone */
function routeToZone(pathname: string): string {
  if (pathname === "/" || pathname === "/index") return "home";
  if (pathname === "/browse") return "discovery";
  if (pathname.startsWith("/trending")) return "trending";
  return "global"; // fallback — only global promos show on other pages
}

/** Animation class per animation_type + promotion_type combo */
function getAnimationStyle(promo: AvatarPromotion, index: number) {
  const baseDelay = index * 2;
  const duration = promo.animation_type === "walk" ? 18 : promo.animation_type === "dance" ? 3 : 12;

  const animationName =
    promo.animation_type === "walk"
      ? "promo-avatar-walk"
      : promo.animation_type === "dance"
        ? "promo-avatar-dance"
        : promo.animation_type === "dj_mix"
          ? "promo-avatar-dj"
          : "promo-avatar-perform";

  const positions = [
    { bottom: "15%", left: "5%" },
    { bottom: "25%", right: "4%" },
    { bottom: "40%", left: "8%" },
  ];

  return {
    animation: `${animationName} ${duration}s ease-in-out ${baseDelay}s infinite`,
    ...positions[index % 3],
  };
}

function PromotedAvatar({ promo, index }: { promo: AvatarPromotion; index: number }) {
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();
  const style = getAnimationStyle(promo, index);

  const handleClick = () => {
    // If has a linked track, play it
    if (promo.track_id && promo.track) {
      playTrack({
        id: promo.track_id,
        title: promo.track.title,
        artist: promo.artist?.display_name || "Unknown",
        coverUrl: promo.track.cover_art_url || "",
        audioUrl: "", // Will be resolved by player
      });
    }
    // Navigate to artist profile
    navigate(`/artist/${promo.artist_id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed z-[1] pointer-events-auto cursor-pointer group",
        "transition-transform duration-300 hover:scale-110"
      )}
      style={{
        ...style,
        willChange: "transform, opacity",
      }}
      title={`${promo.artist?.display_name || "Artist"} — Click to view`}
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl scale-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Avatar */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_25px_hsl(var(--primary)/0.2)] group-hover:border-primary/60 group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.35)] transition-all duration-300">
        {promo.artist?.avatar_url ? (
          <img
            src={promo.artist.avatar_url}
            alt={promo.artist.display_name || ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
            {(promo.artist?.display_name || "?")[0]}
          </div>
        )}
      </div>

      {/* Name label on hover */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[10px] font-semibold text-foreground bg-card/90 border border-border px-2 py-0.5 rounded-full shadow-lg">
          {promo.artist?.display_name}
        </span>
      </div>
    </button>
  );
}

export function PromotedAvatars() {
  const location = useLocation();
  const currentZone = routeToZone(location.pathname);
  const { data: promotions } = useActiveAvatarPromotions(currentZone);

  // Only show max 3, filter by zone
  const visible = useMemo(() => {
    if (!promotions) return [];
    return promotions
      .filter((p) => p.exposure_zone === "global" || p.exposure_zone === currentZone)
      .slice(0, 3);
  }, [promotions, currentZone]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none hidden md:block" aria-hidden="true">
      {visible.map((promo, i) => (
        <PromotedAvatar key={promo.id} promo={promo} index={i} />
      ))}
    </div>
  );
}
