import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Profile card
  const cardScale = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const cardOp = interpolate(frame, [5, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Final logo
  const logoOp = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold shimmer
  const shimmerX = interpolate(frame, [0, 90], [-200, 200]);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Profile card */}
      <div style={{
        opacity: cardOp,
        transform: `scale(${0.85 + cardScale * 0.15})`,
        width: 1200, padding: 80, borderRadius: 60,
        background: "linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)",
        border: "2px solid rgba(184,166,117,0.3)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(184,166,117,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 40,
        position: "relative", overflow: "hidden",
      }}>
        {/* Gold shimmer overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(110deg, transparent 30%, rgba(184,166,117,0.08) 50%, transparent 70%)`,
          transform: `translateX(${shimmerX}%)`,
        }} />

        {/* Avatar */}
        <div style={{
          width: 300, height: 300, borderRadius: "50%", overflow: "hidden",
          border: "4px solid rgba(184,166,117,0.5)",
        }}>
          <Img src={staticFile("images/avatar.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Name */}
        <div style={{ fontSize: 72, fontWeight: 700, color: "#fff", fontFamily: playfair }}>
          Kael Rivers
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 80 }}>
          {[
            { label: "Tracks", value: "1" },
            { label: "Videos", value: "1" },
            { label: "Fans", value: "∞" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: "#B8A675" }}>{stat.value}</div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.4)", letterSpacing: 3, marginTop: 5 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Cover art mini */}
        <div style={{
          width: 500, height: 500, borderRadius: 20, overflow: "hidden",
          border: "2px solid rgba(184,166,117,0.2)",
        }}>
          <Img src={staticFile("images/cover-art.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>

      {/* JumTunes logo text */}
      <div style={{
        position: "absolute", bottom: 400, opacity: logoOp,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <div style={{
          fontSize: 90, fontWeight: 700, color: "#B8A675",
          fontFamily: playfair, letterSpacing: 6,
        }}>
          JumTunes
        </div>
        <div style={{
          fontSize: 36, color: "rgba(255,255,255,0.4)",
          letterSpacing: 8, textTransform: "uppercase",
        }}>
          Your music. Your empire.
        </div>
      </div>
    </AbsoluteFill>
  );
};
