import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourEarnings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Stats
  const stats = [
    { label: "Revenue Split", value: "85%", sub: "Artists keep 85¢ of every dollar", delay: 40 },
    { label: "Free Trial", value: "30", sub: "Days to explore everything", delay: 90 },
    { label: "Starter Credits", value: "15", sub: "Free AI credits to get started", delay: 140 },
  ];

  // Gold coin animation
  const coinFloat = Math.sin(frame * 0.06) * 15;
  const coinRotate = interpolate(frame, [0, 330], [0, 180]);
  const coinOp = interpolate(frame, [30, 60], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #1a1510 50%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Background coin */}
      <div style={{
        position: "absolute", opacity: coinOp,
        transform: `translateY(${coinFloat}px) rotateY(${coinRotate}deg)`,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,166,117,0.15) 0%, transparent 70%)",
      }} />

      {/* Title */}
      <div style={{ position: "absolute", top: 80, textAlign: "center", opacity: titleOp }}>
        <div style={{ fontFamily: playfair, fontSize: 52, fontWeight: 700, color: "#B8A675" }}>
          💰 Earn Real Income
        </div>
        <div style={{ fontFamily: inter, fontSize: 22, color: "rgba(255,255,255,0.4)", marginTop: 10, letterSpacing: 3 }}>
          YOUR MUSIC, YOUR MONEY
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
        {stats.map((stat) => {
          const s = spring({ frame: frame - stat.delay, fps, config: { damping: 15 } });
          const op = interpolate(frame, [stat.delay, stat.delay + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={stat.label} style={{
              opacity: op, transform: `scale(${0.85 + s * 0.15})`,
              width: 320, padding: "40px 30px", borderRadius: 24,
              background: "linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)",
              border: "2px solid rgba(184,166,117,0.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: playfair, fontSize: 72, fontWeight: 700, color: "#B8A675" }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 600, color: "#fff", marginTop: 12 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
