import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const AI_TOOLS = [
  { icon: "🎨", title: "AI Cover Art", desc: "Generate stunning album artwork" },
  { icon: "🧑‍🎤", title: "AI Avatar", desc: "Create your artist identity" },
  { icon: "🎬", title: "AI Video", desc: "Build music videos instantly" },
  { icon: "🎤", title: "Auto Karaoke", desc: "Instant sing-along versions" },
];

export const TourGrowMyMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Screenshot
  const screenOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 420], [1.0, 1.04], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: titleOp,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 42, fontWeight: 700, color: "#B8A675" }}>
          ✨ Grow My Music
        </div>
        <div style={{ fontFamily: inter, fontSize: 20, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: 2 }}>
          AI-POWERED CREATIVE TOOLS
        </div>
      </div>

      {/* Screenshot on left */}
      <div style={{
        position: "absolute", top: 130, left: 60, width: "55%", bottom: 40,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp,
        transform: `scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/ai-tools.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* AI Tools cards on right */}
      <div style={{
        position: "absolute", right: 60, top: 150, width: 380,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {AI_TOOLS.map((tool, i) => {
          const delay = 60 + i * 50;
          const cardScale = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const cardOp = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={tool.title} style={{
              opacity: cardOp,
              transform: `scale(${0.9 + cardScale * 0.1})`,
              padding: "20px 24px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(20,20,20,0.9) 100%)",
              border: "1px solid rgba(184,166,117,0.25)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ fontSize: 36 }}>{tool.icon}</div>
              <div>
                <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 600, color: "#fff" }}>{tool.title}</div>
                <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{tool.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
