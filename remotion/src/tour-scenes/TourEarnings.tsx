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

  // Animated counting number for 85%
  const countTo85 = Math.min(85, Math.floor(interpolate(frame, [40, 120], [0, 85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  const stats = [
    { label: "Revenue Split", value: `${countTo85}%`, sub: "Artists keep 85¢ of every dollar", delay: 40 },
    { label: "Free Trial", value: "30", sub: "Days to explore every tool", delay: 100 },
    { label: "Starter Credits", value: "15", sub: "Free AI credits on sign-up", delay: 160 },
  ];

  // Gold background pulse
  const pulseOp = interpolate(Math.sin(frame * 0.04), [-1, 1], [0.02, 0.08]);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #1a1510 50%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Background radial gold */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 40%, rgba(184,166,117,0.15) 0%, transparent 60%)",
        opacity: pulseOp * 3,
      }} />

      {/* Title */}
      <div style={{ position: "absolute", top: 70, textAlign: "center", opacity: titleOp, width: "100%" }}>
        <div style={{ fontFamily: playfair, fontSize: 48, fontWeight: 700, color: "#B8A675" }}>
          Earn Real Income
        </div>
        <div style={{ fontFamily: inter, fontSize: 20, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: 3 }}>
          YOUR MUSIC, YOUR MONEY
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: 36, marginTop: 30 }}>
        {stats.map((stat, idx) => {
          const s = spring({ frame: frame - stat.delay, fps, config: { damping: 15 } });
          const op = interpolate(frame, [stat.delay, stat.delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={stat.label} style={{
              opacity: op, transform: `scale(${0.85 + s * 0.15})`,
              width: 300, padding: "36px 28px", borderRadius: 22,
              background: "linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)",
              border: idx === 0 ? "2px solid rgba(184,166,117,0.4)" : "1px solid rgba(184,166,117,0.15)",
              boxShadow: idx === 0 ? "0 20px 60px rgba(184,166,117,0.1)" : "0 15px 40px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: playfair, fontSize: 64, fontWeight: 700, color: "#B8A675" }}>
                {idx === 0 ? stat.value : stat.value}
              </div>
              <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 10 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
