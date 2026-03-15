import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useActiveAvatarPromotions } from "@/hooks/useAvatarPromotions";

function routeToZone(pathname: string): string | undefined {
  if (pathname === "/" || pathname === "/index") return "home";
  if (pathname === "/browse") return "discovery";
  return undefined;
}

export function FeaturedArtistSlideshow() {
  const location = useLocation();
  const zone = routeToZone(location.pathname);
  const { data: promotions } = useActiveAvatarPromotions(zone);

  const avatars = useMemo(() => {
    if (!promotions) return [];
    return promotions.filter((p) => p.artist?.avatar_url).slice(0, 10);
  }, [promotions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!zone || avatars.length === 0) return;

    const interval = setInterval(() => {
      setVisible(true);
      setCurrentIndex((prev) => (prev + 1) % avatars.length);
      setTimeout(() => setVisible(false), 3000);
    }, 7000);

    return () => clearInterval(interval);
  }, [zone, avatars.length]);

  if (!zone || avatars.length === 0) return null;

  const current = avatars[currentIndex];
  if (!current?.artist?.avatar_url) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-700"
      style={{ zIndex: 0, opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative rounded-full overflow-hidden transition-transform duration-700"
          style={{
            width: "min(280px, 40vw)",
            height: "min(280px, 40vw)",
            opacity: 0.15,
            filter: "blur(1px)",
            transform: visible ? "scale(1)" : "scale(0.8)",
          }}
        >
          <img
            src={current.artist.avatar_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {current.artist.display_name && (
          <div
            className="absolute bottom-[38%] text-center transition-opacity duration-500"
            style={{ opacity: visible ? 0.25 : 0 }}
          >
            <span className="text-sm font-medium text-foreground tracking-wider uppercase">
              {current.artist.display_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
