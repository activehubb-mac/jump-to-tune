import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const AVATARS = [
  "avatar-flames.png",
  "avatar-street.png",
  "avatar-robot.png",
  "avatar-male-singer.png",
  "avatar-female-singer.png",
  "avatar-braids-singer.png",
  "avatar-dj.png",
];

export const TourIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flashOp = interpolate(frame, [0, 10, 30], [0, 0.4, 0], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 100 } });
  const logoOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tagOp = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [55, 85], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subtitleOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [100, 130], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineW = interpolate(frame, [10, 80], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tourOp = interpolate(frame, [300, 330], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tourScale = spring({ frame: frame - 300, fps, config: { damping: 15 } });

  const gradAngle = interpolate(frame, [0, 390], [180, 210]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradAngle}deg, #0a0a0a 0%, #141414 35%, #1a1510 65%, #0a0a0a 100%)`,
      justifyContent: "center", alignItems: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.5) 0%, transparent 50%)", opacity: flashOp }} />

      {/* Floating avatar gallery */}
      {AVATARS.map((av, i) => {
        const delay = 140 + i * 20;
        const op = interpolate(frame, [delay, delay + 30], [0, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const angle = (i / AVATARS.length) * Math.PI * 2;
        const radius = 380;
        const x = Math.cos(angle + frame * 0.003) * radius;
        const y = Math.sin(angle + frame * 0.003) * radius * 0.35;
        const rot = Math.sin(frame * 0.02 + i) * 5;
        return (
          <div key={av} style={{
            position: "absolute",
            left: `calc(50% + ${x}px - 60px)`,
            top: `calc(50% + ${y}px - 60px)`,
            width: 120, height: 120,
            borderRadius: 16, overflow: "hidden", opacity: op,
            transform: `rotate(${rot}deg)`,
            boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
            border: "2px solid rgba(184,166,117,0.2)",
          }}>
            <Img src={staticFile(`images/${av}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 2 }}>
        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />

        <div style={{ opacity: logoOp, transform: `scale(${0.8 + logoScale * 0.2})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 110, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: playfair, fontSize: 60, fontWeight: 700, color: "#B8A675", letterSpacing: 2 }}>
            Full Platform Tour
          </div>
        </div>

        <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)`, fontSize: 26, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase", fontFamily: inter }}>
          The First AI Music Interaction Platform
        </div>

        <div style={{
          opacity: tourOp, transform: `scale(${0.85 + tourScale * 0.15})`,
          marginTop: 30, padding: "16px 44px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(184,166,117,0.15) 0%, rgba(184,166,117,0.05) 100%)",
          border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: playfair, fontSize: 28, fontWeight: 700, color: "#B8A675",
        }}>
          Let's Take a Tour →
        </div>

        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
