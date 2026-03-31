import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourHomepage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const screenOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenY = interpolate(frame, [15, 40], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenPanY = interpolate(frame, [0, 330], [0, -80], { extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 330], [1.0, 1.06], { extrapolateRight: "clamp" });

  const callouts = [
    { text: "Trending Tracks", icon: "🔥", delay: 50, sub: "Real-time popularity ranking" },
    { text: "Featured Artist Spotlight", icon: "⭐", delay: 100, sub: "Discover new talent daily" },
    { text: "AI-Powered Discovery", icon: "🤖", delay: 150, sub: "Smart recommendations" },
    { text: "Curated Playlists", icon: "🎵", delay: 200, sub: "Genre & mood playlists" },
  ];

  const artistOp = interpolate(frame, [240, 270], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const artistScale = spring({ frame: frame - 240, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      <div style={{
        position: "absolute", top: 36, left: 70,
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 40, fontWeight: 700, color: "#B8A675" }}>
          Homepage
        </div>
        <div style={{ fontFamily: inter, fontSize: 18, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          YOUR MUSIC COMMAND CENTER
        </div>
      </div>

      <div style={{
        position: "absolute", top: 120, left: 50, right: 420, bottom: 30,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp,
        transform: `translateY(${screenY}px)`,
      }}>
        <div style={{ transform: `translateY(${screenPanY}px) scale(${screenScale})`, transformOrigin: "top center" }}>
          <Img src={staticFile("screenshots/home.png")} style={{ width: "100%", objectFit: "cover" }} />
        </div>
      </div>

      <div style={{ position: "absolute", right: 50, top: 140, width: 340 }}>
        {callouts.map((c) => {
          const op = interpolate(frame, [c.delay, c.delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [c.delay, c.delay + 20], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={c.text} style={{
              opacity: op, transform: `translateX(${x}px)`,
              padding: "14px 22px", borderRadius: 12, marginBottom: 14,
              background: "linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(18,18,18,0.9) 100%)",
              border: "1px solid rgba(184,166,117,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 600, color: "#B8A675" }}>{c.text}</div>
                  <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{c.sub}</div>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{
          opacity: artistOp, transform: `scale(${0.9 + artistScale * 0.1})`,
          marginTop: 16, padding: "16px 20px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(184,166,117,0.08) 0%, rgba(20,20,20,0.95) 100%)",
          border: "1px solid rgba(184,166,117,0.25)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(184,166,117,0.3)" }}>
            <Img src={staticFile("images/avatar-male-singer.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#fff" }}>Featured Artist</div>
            <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>AI-Powered Discovery</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
