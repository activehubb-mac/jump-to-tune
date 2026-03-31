import { useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

interface CaptionSegment {
  text: string;
  startFrame: number;
  endFrame: number;
}

// Re-synced to match new scene durations and narration flow
// Scene boundaries (cumulative, accounting for 18-frame transitions):
// Intro:      0–440
// Homepage:   422–722   (440-18=422 start)
// GrowMyMusic:704–1084  (722-18=704 start)
// Upload:     1066–1326 (1084-18=1066 start)
// GoDJ:       1308–1628 (1326-18=1308 start)
// Earnings:   1610–1930 (1628-18=1610 start)
// Closing:    1912–2382 (1930-18=1912 start)

const CAPTIONS: CaptionSegment[] = [
  // Intro section (0–440)
  { text: "Welcome to JumTunes", startFrame: 5, endFrame: 70 },
  { text: "The first AI music interaction platform", startFrame: 75, endFrame: 150 },
  { text: "A full creative ecosystem for artists", startFrame: 160, endFrame: 240 },
  { text: "Upload music, build your brand with AI", startFrame: 245, endFrame: 330 },
  { text: "and earn real income", startFrame: 335, endFrame: 390 },
  { text: "Let's take a tour", startFrame: 395, endFrame: 435 },

  // Homepage section (422–722)
  { text: "Trending tracks, curated playlists", startFrame: 440, endFrame: 530 },
  { text: "and a featured artist spotlight", startFrame: 540, endFrame: 620 },
  { text: "all powered by AI discovery", startFrame: 630, endFrame: 715 },

  // Grow My Music section (704–1084)
  { text: "Grow My Music — AI-powered tools", startFrame: 720, endFrame: 810 },
  { text: "Generate cover art, create AI avatars", startFrame: 820, endFrame: 920 },
  { text: "Build music videos and auto karaoke", startFrame: 930, endFrame: 1075 },

  // Upload section (1066–1326)
  { text: "Upload your song in seconds", startFrame: 1080, endFrame: 1160 },
  { text: "Recording protection and unique Recording ID", startFrame: 1170, endFrame: 1320 },

  // Go DJ section (1308–1628)
  { text: "Go DJ — live mix sessions", startFrame: 1330, endFrame: 1420 },
  { text: "Compete on leaderboards", startFrame: 1430, endFrame: 1510 },
  { text: "Earn from fan submissions", startFrame: 1520, endFrame: 1620 },

  // Earnings section (1610–1930)
  { text: "Artists earn 85% of every sale", startFrame: 1640, endFrame: 1760 },
  { text: "30-day free trial with 15 starter credits", startFrame: 1770, endFrame: 1920 },

  // Closing (1912–2382)
  { text: "Create. Share. Get paid.", startFrame: 1960, endFrame: 2120 },
  { text: "The future of music starts here", startFrame: 2140, endFrame: 2350 },
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
      bottom: 50,
      left: 0, right: 0,
      display: "flex", justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}>
      <div style={{
        padding: "12px 32px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(184,166,117,0.15)",
      }}>
        <div style={{
          fontFamily: inter,
          fontSize: 26,
          fontWeight: 600,
          color: "#B8A675",
          textAlign: "center",
          letterSpacing: 0.5,
        }}>
          {activeCaption.text}
        </div>
      </div>
    </div>
  );
};
