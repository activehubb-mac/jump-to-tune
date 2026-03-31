import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const AVATAR_RESULTS = [
  { img: "avatar-flames.png", label: "Style Mode", style: "Cinematic Portrait" },
  { img: "avatar-street.png", label: "Full Mode", style: "Urban Street" },
  { img: "avatar-robot.png", label: "Full Mode", style: "Cyber DJ" },
];

const MODES = [
  { name: "Quick", credits: "2", desc: "Fast avatar in seconds", color: "#4ECDC4" },
  { name: "Style", credits: "3", desc: "Styled artistic avatar", color: "#B8A675" },
  { name: "Full", credits: "5", desc: "Premium cinematic quality", color: "#FF6B6B" },
];

export const TourIdentityBuilder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "Before" photo
  const beforeOp = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beforeScale = spring({ frame: frame - 30, fps, config: { damping: 15 } });

  // Arrow / transformation indicator
  const arrowOp = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrowX = interpolate(frame, [80, 110], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Generation modes
  const modesStartFrame = 140;

  // Result avatars appearing one by one
  const resultsStartFrame = 240;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #12100d 50%, #0a0a0a 100%)" }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 32, left: 70, opacity: titleOp }}>
        <div style={{ fontFamily: playfair, fontSize: 40, fontWeight: 700, color: "#B8A675" }}>
          AI Identity Builder
        </div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          TRANSFORM A SELFIE INTO AN AI AVATAR
        </div>
      </div>

      {/* Before photo (placeholder silhouette) */}
      <div style={{
        position: "absolute", top: 140, left: 80,
        opacity: beforeOp, transform: `scale(${0.9 + beforeScale * 0.1})`,
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(40,40,40,0.9) 0%, rgba(25,25,25,0.9) 100%)",
          border: "2px solid rgba(255,255,255,0.1)",
          display: "flex", justifyContent: "center", alignItems: "center",
          flexDirection: "column", gap: 10,
        }}>
          <div style={{ fontSize: 50 }}>📸</div>
          <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Your Selfie</div>
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        position: "absolute", top: 220, left: 310,
        opacity: arrowOp, transform: `translateX(${arrowX}px)`,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 36, color: "#B8A675" }}>→</div>
      </div>

      {/* Result avatars */}
      <div style={{
        position: "absolute", top: 120, left: 370,
        display: "flex", gap: 20,
      }}>
        {AVATAR_RESULTS.map((av, i) => {
          const delay = resultsStartFrame + i * 35;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          return (
            <div key={av.img} style={{
              opacity: op, transform: `scale(${0.85 + s * 0.15})`,
            }}>
              <div style={{
                width: 200, height: 240, borderRadius: 18, overflow: "hidden",
                border: "2px solid rgba(184,166,117,0.3)",
                boxShadow: "0 15px 45px rgba(0,0,0,0.6)",
              }}>
                <Img src={staticFile(`images/${av.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "#B8A675" }}>{av.label}</div>
                <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{av.style}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generation mode cards at bottom */}
      <div style={{
        position: "absolute", bottom: 40, left: 70, right: 70,
        display: "flex", gap: 16,
      }}>
        {MODES.map((mode, i) => {
          const delay = modesStartFrame + i * 25;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={mode.name} style={{
              flex: 1, opacity: op, transform: `translateY(${y}px)`,
              padding: "18px 22px", borderRadius: 14,
              background: "linear-gradient(160deg, rgba(30,30,30,0.95) 0%, rgba(18,18,18,0.95) 100%)",
              border: `1px solid ${mode.color}30`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 600, color: mode.color }}>{mode.name}</div>
                <div style={{
                  padding: "3px 10px", borderRadius: 12,
                  background: `${mode.color}15`,
                  fontFamily: inter, fontSize: 12, fontWeight: 600, color: mode.color,
                }}>
                  {mode.credits} credits
                </div>
              </div>
              <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
                {mode.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
