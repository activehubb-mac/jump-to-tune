import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useActiveAvatarPromotions, type AvatarPromotion } from "@/hooks/useAvatarPromotions";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";

/** Map current route to exposure zone */
function routeToZone(pathname: string): string {
  if (pathname === "/" || pathname === "/index") return "home";
  if (pathname === "/browse") return "discovery";
  if (pathname.startsWith("/trending")) return "trending";
  return "global";
}

/** Generate a random position avoiding the center content area */
function randomPosition(seed: number) {
  // Pick a side: left gutter or right gutter (avoid center 20-80%)
  const side = seed % 2 === 0 ? "left" : "right";
  const horizontal = Math.floor(2 + (seed * 7 + 13) % 12); // 2-13%
  const vertical = Math.floor(10 + (seed * 11 + 7) % 70);  // 10-79%

  return {
    [side]: `${horizontal}%`,
    top: `${vertical}%`,
  } as React.CSSProperties;
}

/** Animation class per animation_type + promotion_type combo */
function getAnimationStyle(promo: AvatarPromotion, index: number, positionSeed: number) {
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

  return {
    animation: `${animationName} ${duration}s ease-in-out ${baseDelay}s infinite`,
    ...randomPosition(positionSeed + index),
  };
}

function PromotedAvatar({ promo, index, positionSeed }: { promo: AvatarPromotion; index: number; positionSeed: number }) {
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();
  const style = getAnimationStyle(promo, index, positionSeed);

  const handleClick = () => {
    // If has a linked track, play it
    if (promo.track_id && promo.track) {
      playTrack({
        id: promo.track_id,
        title: promo.track.title,
        audio_url: "",
        cover_art_url: promo.track.cover_art_url || null,
        artist: {
          id: promo.artist_id,
          display_name: promo.artist?.display_name || "Unknown",
        },
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

  // Randomize positions — reshuffle every 20 seconds
  const [positionSeed, setPositionSeed] = useState(() => Math.floor(Math.random() * 1000));
  useEffect(() => {
    const interval = setInterval(() => {
      setPositionSeed(Math.floor(Math.random() * 1000));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Only show max 3, filter by zone
  const visible = useMemo(() => {
    if (!promotions) return [];
    // Shuffle order based on seed
    const filtered = promotions
      .filter((p) => p.exposure_zone === "global" || p.exposure_zone === currentZone);
    const shuffled = [...filtered].sort(() => (positionSeed % 3) - 1);
    return shuffled.slice(0, 3);
  }, [promotions, currentZone, positionSeed]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none hidden md:block" aria-hidden="true">
      {visible.map((promo, i) => (
        <PromotedAvatar key={`${promo.id}-${positionSeed}`} promo={promo} index={i} positionSeed={positionSeed} />
      ))}
    </div>
  );
}
