import { useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

interface CaptionSegment {
  text: string;
  startFrame: number;
  endFrame: number;
}

const CAPTIONS: CaptionSegment[] = [
  { text: "Welcome to JumTunes", startFrame: 10, endFrame: 85 },
  { text: "The first AI music platform", startFrame: 100, endFrame: 180 },
  { text: "where creators turn ideas into", startFrame: 180, endFrame: 240 },
  { text: "real music, visuals, and income", startFrame: 240, endFrame: 310 },
  { text: "in seconds.", startFrame: 310, endFrame: 360 },
  { text: "Create.", startFrame: 380, endFrame: 450 },
  { text: "Share.", startFrame: 470, endFrame: 540 },
  { text: "Get paid.", startFrame: 560, endFrame: 640 },
  { text: "This is the future of music.", startFrame: 800, endFrame: 895 },
];

export const CaptionOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  const activeCaption = CAPTIONS.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  if (!activeCaption) return null;

  const fadeIn = interpolate(frame, [activeCaption.startFrame, activeCaption.startFrame + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [activeCaption.endFrame - 8, activeCaption.endFrame], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const y = interpolate(frame, [activeCaption.startFrame, activeCaption.startFrame + 10], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute",
      bottom: 200,
      left: 0, right: 0,
      display: "flex", justifyContent: "center",
      opacity,
      transform: `translateY(${y}px)`,
      pointerEvents: "none",
    }}>
      <div style={{
        padding: "30px 60px",
        borderRadius: 20,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "none",
      }}>
        <div style={{
          fontFamily: inter,
          fontSize: 56,
          fontWeight: 600,
          color: "#B8A675",
          textAlign: "center",
          letterSpacing: 2,
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}>
          {activeCaption.text}
        </div>
      </div>
    </div>
  );
};
