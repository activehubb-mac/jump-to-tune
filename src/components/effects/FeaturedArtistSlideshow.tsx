import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useFeaturedArtists } from "@/hooks/useFeaturedContent";

export function FeaturedArtistSlideshow() {
  const location = useLocation();
  const isHomeOrArtist =
    location.pathname === "/" ||
    location.pathname === "/index" ||
    location.pathname.startsWith("/artist");

  const { data: featuredArtists } = useFeaturedArtists("artists_page");

  const avatars = useMemo(() => {
    if (!featuredArtists) return [];
    return featuredArtists
      .filter((fa) => fa.profile?.avatar_url)
      .slice(0, 10);
  }, [featuredArtists]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isHomeOrArtist || avatars.length === 0) return;

    // Every 10s: show for 3s, then hide
    const interval = setInterval(() => {
      setVisible(true);
      setCurrentIndex((prev) => (prev + 1) % avatars.length);

      setTimeout(() => {
        setVisible(false);
      }, 3000);
    }, 10000);

    return () => clearInterval(interval);
  }, [isHomeOrArtist, avatars.length]);

  if (!isHomeOrArtist || avatars.length === 0) return null;

  const current = avatars[currentIndex];
  if (!current?.profile?.avatar_url) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-700"
      style={{
        zIndex: 0,
        opacity: visible ? 1 : 0,
      }}
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
            src={current.profile.avatar_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {current.profile.display_name && (
          <div
            className="absolute bottom-[38%] text-center transition-opacity duration-500"
            style={{ opacity: visible ? 0.25 : 0 }}
          >
            <span className="text-sm font-medium text-foreground tracking-wider uppercase">
              {current.profile.display_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
