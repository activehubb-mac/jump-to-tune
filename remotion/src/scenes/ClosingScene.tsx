import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Profile card
  const cardScale = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const cardOp = interpolate(frame, [5, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Logo
  const logoOp = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold shimmer
  const shimmerX = interpolate(frame, [0, 120], [-200, 200]);

  // Tagline
  const tagOp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Profile card */}
      <div style={{
        opacity: cardOp,
        transform: `scale(${0.85 + cardScale * 0.15})`,
        width: 1400, padding: 80, borderRadius: 60,
        background: "linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)",
        border: "2px solid rgba(184,166,117,0.3)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(184,166,117,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 50,
        position: "relative", overflow: "hidden",
      }}>
        {/* Gold shimmer */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(110deg, transparent 30%, rgba(184,166,117,0.08) 50%, transparent 70%)`,
          transform: `translateX(${shimmerX}%)`,
        }} />

        {/* Avatar */}
        <div style={{
          width: 400, height: 400, borderRadius: "50%", overflow: "hidden",
          border: "4px solid rgba(184,166,117,0.5)",
          boxShadow: "0 0 40px rgba(184,166,117,0.15)",
        }}>
          <Img src={staticFile("images/ai-avatar.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 100 }}>
          {[
            { label: "Tracks", value: "1" },
            { label: "Videos", value: "1" },
            { label: "Fans", value: "∞" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, fontWeight: 700, color: "#B8A675" }}>{stat.value}</div>
              <div style={{ fontSize: 30, color: "rgba(255,255,255,0.4)", letterSpacing: 3, marginTop: 5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Real JumTunes logo */}
      <div style={{
        position: "absolute", bottom: 500, opacity: logoOp,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 30,
      }}>
        <Img
          src={staticFile("images/jumtunes-logo.png")}
          style={{ width: 600, height: "auto", objectFit: "contain" }}
        />
        <div style={{
          fontSize: 44, color: "rgba(255,255,255,0.4)",
          letterSpacing: 8, textTransform: "uppercase",
          opacity: tagOp,
        }}>
          This is the future of music.
        </div>
      </div>
    </AbsoluteFill>
  );
};
