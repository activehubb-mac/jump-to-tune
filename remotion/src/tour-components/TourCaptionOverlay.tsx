import { useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

interface CaptionSegment {
  text: string;
  startFrame: number;
  endFrame: number;
}

// Synced to the voiceover narration (~77s at 30fps = ~2310 frames)
// These timings match the narration flow
const CAPTIONS: CaptionSegment[] = [
  { text: "Welcome to JumTunes", startFrame: 5, endFrame: 60 },
  { text: "The first AI music interaction platform", startFrame: 60, endFrame: 120 },
  { text: "A full creative ecosystem", startFrame: 140, endFrame: 210 },
  { text: "where artists upload music, build their brand with AI", startFrame: 210, endFrame: 300 },
  { text: "and earn real income", startFrame: 300, endFrame: 360 },
  { text: "Let's take a tour", startFrame: 370, endFrame: 420 },
  // Homepage section
  { text: "Trending tracks, curated playlists", startFrame: 440, endFrame: 540 },
  { text: "and a featured artist spotlight", startFrame: 540, endFrame: 620 },
  { text: "all powered by AI discovery", startFrame: 620, endFrame: 700 },
  // Grow My Music section
  { text: "Grow My Music — AI-powered tools", startFrame: 720, endFrame: 810 },
  { text: "Generate cover art, create AI avatars", startFrame: 810, endFrame: 920 },
  { text: "Build music videos and auto karaoke", startFrame: 920, endFrame: 1040 },
  // Upload section
  { text: "Upload your song in seconds", startFrame: 1060, endFrame: 1140 },
  { text: "Recording protection and unique Recording ID", startFrame: 1140, endFrame: 1280 },
  // Go DJ section
  { text: "Go DJ — live mix sessions", startFrame: 1320, endFrame: 1420 },
  { text: "Compete on leaderboards", startFrame: 1420, endFrame: 1500 },
  { text: "Earn from fan submissions", startFrame: 1500, endFrame: 1600 },
  // Earnings section
  { text: "Artists earn 85% of every sale", startFrame: 1640, endFrame: 1760 },
  { text: "30-day free trial with 15 starter credits", startFrame: 1760, endFrame: 1900 },
  // Closing
  { text: "Create. Share. Get paid.", startFrame: 1960, endFrame: 2100 },
  { text: "The future of music starts here", startFrame: 2120, endFrame: 2300 },
];

export const TourCaptionOverlay: React.FC = () => {
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

  return (
    <div style={{
      position: "absolute",
      bottom: 60,
      left: 0, right: 0,
      display: "flex", justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}>
      <div style={{
        padding: "14px 36px",
        borderRadius: 12,
        background: "rgba(0,0,0,0.65)",
      }}>
        <div style={{
          fontFamily: inter,
          fontSize: 28,
          fontWeight: 600,
          color: "#B8A675",
          textAlign: "center",
          letterSpacing: 1,
        }}>
          {activeCaption.text}
        </div>
      </div>
    </div>
  );
};
