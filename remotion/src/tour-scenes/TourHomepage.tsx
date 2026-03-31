import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourHomepage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Screenshot with Ken Burns
  const screenScale = interpolate(frame, [0, 330], [1.0, 1.05], { extrapolateRight: "clamp" });
  const screenOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenY = interpolate(frame, [20, 50], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Highlight glow pulsing on the screenshot
  const highlightOp = interpolate(Math.sin(frame * 0.04), [-1, 1], [0, 0.15]);

  // Feature callouts
  const callout1Op = interpolate(frame, [80, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const callout2Op = interpolate(frame, [140, 170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const callout3Op = interpolate(frame, [200, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      {/* Section title */}
      <div style={{
        position: "absolute", top: 40, left: 80,
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 42, fontWeight: 700, color: "#B8A675" }}>
          🏠 Homepage
        </div>
        <div style={{ fontFamily: inter, fontSize: 20, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: 2 }}>
          YOUR MUSIC COMMAND CENTER
        </div>
      </div>

      {/* Screenshot */}
      <div style={{
        position: "absolute", top: 130, left: 60, right: 60, bottom: 40,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp,
        transform: `translateY(${screenY}px) scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/home.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Gold overlay glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 70% 30%, rgba(184,166,117,0.1) 0%, transparent 60%)",
          opacity: highlightOp,
        }} />
      </div>

      {/* Feature callouts - floating labels */}
      <div style={{
        position: "absolute", right: 80, top: 200,
        opacity: callout1Op, display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(184,166,117,0.15)", border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#B8A675",
        }}>
          🔥 Trending Tracks
        </div>
      </div>

      <div style={{
        position: "absolute", right: 80, top: 260,
        opacity: callout2Op, display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(184,166,117,0.15)", border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#B8A675",
        }}>
          ⭐ Featured Artist Spotlight
        </div>
      </div>

      <div style={{
        position: "absolute", right: 80, top: 320,
        opacity: callout3Op, display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(184,166,117,0.15)", border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#B8A675",
        }}>
          🤖 AI-Powered Discovery
        </div>
      </div>
    </AbsoluteFill>
  );
};
