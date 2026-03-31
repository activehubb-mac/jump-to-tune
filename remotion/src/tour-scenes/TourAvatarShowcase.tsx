import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const AVATARS = [
  { img: "avatar-flames.png", label: "Cinematic Portrait" },
  { img: "avatar-street.png", label: "Urban Street" },
  { img: "avatar-robot.png", label: "Cyber DJ" },
  { img: "avatar-male-singer.png", label: "Stage Performer" },
  { img: "avatar-female-singer.png", label: "Vocal Artist" },
  { img: "avatar-braids-singer.png", label: "Soul Singer" },
  { img: "avatar-dj.png", label: "Club DJ" },
];

export const TourAvatarShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Slow horizontal drift of the gallery
  const driftX = interpolate(frame, [0, 360], [0, -60], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #12100d 50%, #0a0a0a 100%)" }}>
      {/* Gold ambient glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 60%, rgba(184,166,117,0.08) 0%, transparent 60%)",
      }} />

      <div style={{
        position: "absolute", top: 40, width: "100%", textAlign: "center",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 42, fontWeight: 700, color: "#B8A675" }}>
          AI-Generated Avatars
        </div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: 2 }}>
          EVERY AVATAR IS UNIQUE • EVERY AVATAR PERFORMS
        </div>
      </div>

      {/* Avatar gallery */}
      <div style={{
        position: "absolute", top: 150, left: 0, right: 0, bottom: 40,
        display: "flex", justifyContent: "center", alignItems: "center",
        transform: `translateX(${driftX}px)`,
      }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {AVATARS.map((av, i) => {
            const delay = 30 + i * 25;
            const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
            const isCenter = i === 3;
            const size = isCenter ? 240 : 180;
            const floatY = Math.sin(frame * 0.025 + i * 1.2) * 8;

            return (
              <div key={av.img} style={{
                opacity: op,
                transform: `scale(${0.85 + s * 0.15}) translateY(${floatY}px)`,
              }}>
                <div style={{
                  width: size, height: size * 1.15, borderRadius: 18, overflow: "hidden",
                  border: isCenter ? "3px solid rgba(184,166,117,0.5)" : "2px solid rgba(184,166,117,0.15)",
                  boxShadow: isCenter
                    ? "0 25px 60px rgba(184,166,117,0.15), 0 10px 30px rgba(0,0,0,0.5)"
                    : "0 15px 40px rgba(0,0,0,0.6)",
                }}>
                  <Img src={staticFile(`images/${av.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{
                  textAlign: "center", marginTop: 10,
                  fontFamily: inter, fontSize: 13, fontWeight: 600,
                  color: isCenter ? "#B8A675" : "rgba(255,255,255,0.35)",
                }}>
                  {av.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
