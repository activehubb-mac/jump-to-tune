import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourGoDJ: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 390], [1.0, 1.04], { extrapolateRight: "clamp" });

  const features = [
    { icon: "🎧", text: "Curated Mix Sessions", sub: "Build DJ sets from JumTunes tracks", delay: 60 },
    { icon: "🏆", text: "DJ Leaderboards", sub: "Compete for top curator spots", delay: 120 },
    { icon: "💰", text: "Paid Fan Submissions", sub: "Fans pay to get their tracks featured", delay: 180 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #0a0a0a 100%)" }}>
      {/* Equalizer bars */}
      <div style={{
        position: "absolute", bottom: 30, left: 50, right: 50, height: 60,
        display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6,
        opacity: 0.12,
      }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const h = interpolate(Math.sin(frame * 0.12 + i * 0.8), [-1, 1], [10, 50]);
          return (
            <div key={i} style={{
              width: 8, height: h, borderRadius: 4,
              background: "linear-gradient(180deg, #B8A675 0%, rgba(184,166,117,0.3) 100%)",
            }} />
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 32, left: 70, opacity: titleOp }}>
        <div style={{ fontFamily: playfair, fontSize: 40, fontWeight: 700, color: "#B8A675" }}>Go DJ</div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          THE CURATOR ECONOMY
        </div>
      </div>

      <div style={{
        position: "absolute", top: 120, left: 50, width: "55%", bottom: 80,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp, transform: `scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/go-dj.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ position: "absolute", right: 50, top: 160, width: 380, display: "flex", flexDirection: "column", gap: 18 }}>
        {features.map((f) => {
          const op = interpolate(frame, [f.delay, f.delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [f.delay, f.delay + 22], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={f.text} style={{
              opacity: op, transform: `translateX(${x}px)`,
              padding: "20px 24px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(18,18,18,0.95) 100%)",
              border: "1px solid rgba(184,166,117,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ fontSize: 30 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 600, color: "#fff" }}>{f.text}</div>
                <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{f.sub}</div>
              </div>
            </div>
          );
        })}

        {/* DJ avatar */}
        <div style={{
          opacity: interpolate(frame, [250, 280], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(184,166,117,0.08) 0%, rgba(20,20,20,0.95) 100%)",
          border: "1px solid rgba(184,166,117,0.25)",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(184,166,117,0.3)" }}>
            <Img src={staticFile("images/avatar-robot.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#fff" }}>DJ Mode Active</div>
            <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Your avatar curates live</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
