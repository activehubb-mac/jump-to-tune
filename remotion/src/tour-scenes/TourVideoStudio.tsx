import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const VIDEO_TYPES = [
  { name: "Music Video", icon: "🎬", desc: "Full cinematic AI video", credits: "5 credits" },
  { name: "Lyric Video", icon: "📝", desc: "Animated lyrics synced to music", credits: "3 credits" },
  { name: "Viral Clip", icon: "📱", desc: "Short-form for TikTok & Reels", credits: "3 credits" },
];

export const TourVideoStudio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Avatar performing — large showcase
  const avatarOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const avatarScale = spring({ frame: frame - 20, fps, config: { damping: 14 } });

  // Equalizer bars behind avatar
  const eqBars = 20;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #0a0a0a 100%)" }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 32, left: 70, opacity: titleOp, zIndex: 2 }}>
        <div style={{ fontFamily: playfair, fontSize: 40, fontWeight: 700, color: "#B8A675" }}>
          AI Video Studio
        </div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          YOUR AVATAR PERFORMS IN EVERY VIDEO
        </div>
      </div>

      {/* Large avatar showcase */}
      <div style={{
        position: "absolute", top: 110, left: 70,
        width: 500, height: 550, borderRadius: 22, overflow: "hidden",
        opacity: avatarOp, transform: `scale(${0.92 + avatarScale * 0.08})`,
        border: "2px solid rgba(184,166,117,0.25)",
        boxShadow: "0 25px 70px rgba(0,0,0,0.7)",
      }}>
        <Img src={staticFile("images/avatar-braids-singer.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Equalizer overlay at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4,
          padding: "0 20px 10px",
        }}>
          {Array.from({ length: eqBars }).map((_, i) => {
            const h = interpolate(Math.sin(frame * 0.15 + i * 0.7), [-1, 1], [6, 35]);
            return (
              <div key={i} style={{
                width: 5, height: h, borderRadius: 3,
                background: `linear-gradient(180deg, #B8A675 0%, rgba(184,166,117,0.3) 100%)`,
              }} />
            );
          })}
        </div>

        {/* "Playing" label */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          padding: "6px 14px", borderRadius: 20,
          background: "rgba(184,166,117,0.2)",
          border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: inter, fontSize: 12, fontWeight: 600, color: "#B8A675",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#B8A675",
            opacity: interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 1]),
          }} />
          AI Performance
        </div>
      </div>

      {/* Video type cards on right */}
      <div style={{
        position: "absolute", right: 50, top: 140, width: 380,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {VIDEO_TYPES.map((vt, i) => {
          const delay = 80 + i * 40;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [delay, delay + 22], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={vt.name} style={{
              opacity: op, transform: `translateX(${x}px)`,
              padding: "22px 24px", borderRadius: 16,
              background: "linear-gradient(160deg, rgba(30,30,30,0.95) 0%, rgba(18,18,18,0.95) 100%)",
              border: "1px solid rgba(184,166,117,0.15)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{vt.icon}</span>
                  <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 600, color: "#fff" }}>{vt.name}</div>
                </div>
                <div style={{
                  padding: "4px 12px", borderRadius: 14,
                  background: "rgba(184,166,117,0.12)",
                  fontFamily: inter, fontSize: 12, fontWeight: 600, color: "#B8A675",
                }}>
                  {vt.credits}
                </div>
              </div>
              <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                {vt.desc}
              </div>
            </div>
          );
        })}

        {/* Second avatar accent */}
        <div style={{
          opacity: interpolate(frame, [200, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 18px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(184,166,117,0.06) 0%, rgba(20,20,20,0.9) 100%)",
          border: "1px solid rgba(184,166,117,0.15)",
        }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, overflow: "hidden" }}>
            <Img src={staticFile("images/avatar-dj.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "#fff" }}>Multiple Styles Available</div>
            <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Every avatar can perform</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
