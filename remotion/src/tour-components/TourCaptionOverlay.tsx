import { useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

interface CaptionSegment {
  text: string;
  startFrame: number;
  endFrame: number;
}

// Scene boundaries (cumulative, accounting for 18-frame transitions):
// Intro:           0–390
// Homepage:        372–702     (390-18)
// GrowMyMusic:     684–1314    (702-18)
// IdentityBuilder: 1296–1746   (1314-18)
// VideoStudio:     1728–2058   (1746-18)
// Upload:          2040–2430   (2058-18)
// GoDJ:            2412–2802   (2430-18)
// Earnings:        2784–3264   (2802-18)
// AvatarShowcase:  3246–3606   (3264-18)
// Closing:         3588–4050   (3606-18)

const CAPTIONS: CaptionSegment[] = [
  // Intro (0–390)
  { text: "Welcome to JumTunes", startFrame: 10, endFrame: 80 },
  { text: "The first AI music interaction platform", startFrame: 90, endFrame: 180 },
  { text: "Real music, real visuals, real income", startFrame: 190, endFrame: 280 },
  { text: "Let's take a full tour", startFrame: 300, endFrame: 380 },

  // Homepage (372–702)
  { text: "The homepage is your command center", startFrame: 385, endFrame: 470 },
  { text: "Trending tracks and featured spotlights", startFrame: 480, endFrame: 570 },
  { text: "All powered by AI discovery", startFrame: 580, endFrame: 690 },

  // Grow My Music (684–1314)
  { text: "Grow My Music — the creative engine", startFrame: 700, endFrame: 790 },
  { text: "Go Viral: AI Video Studio & Viral Generator", startFrame: 800, endFrame: 910 },
  { text: "Build Your Artist: Identity Builder & Cover Art", startFrame: 930, endFrame: 1060 },
  { text: "Grow Your Reach: Playlists & Karaoke", startFrame: 1080, endFrame: 1300 },

  // Identity Builder (1296–1746)
  { text: "Transform a selfie into a professional AI avatar", startFrame: 1310, endFrame: 1430 },
  { text: "Quick, Style, or Full generation modes", startFrame: 1450, endFrame: 1570 },
  { text: "Your avatar becomes the face of your music", startFrame: 1590, endFrame: 1730 },

  // Video Studio (1728–2058)
  { text: "The AI Video Studio brings your avatar to life", startFrame: 1740, endFrame: 1850 },
  { text: "Music videos, lyric videos, viral clips", startFrame: 1860, endFrame: 1970 },
  { text: "Your AI identity performs in every video", startFrame: 1980, endFrame: 2045 },

  // Upload (2040–2430)
  { text: "Upload your music in seconds", startFrame: 2055, endFrame: 2150 },
  { text: "Every track gets a unique Recording ID", startFrame: 2160, endFrame: 2280 },
  { text: "Your music is protected from day one", startFrame: 2300, endFrame: 2415 },

  // Go DJ (2412–2802)
  { text: "Go DJ — the curator economy", startFrame: 2425, endFrame: 2530 },
  { text: "Build mix sessions, compete on leaderboards", startFrame: 2540, endFrame: 2660 },
  { text: "Earn from fan submissions", startFrame: 2670, endFrame: 2790 },

  // Earnings (2784–3264)
  { text: "Artists earn 85% of every sale", startFrame: 2800, endFrame: 2930 },
  { text: "The highest split in the industry", startFrame: 2940, endFrame: 3050 },
  { text: "30-day free trial with 15 AI credits", startFrame: 3060, endFrame: 3250 },

  // Avatar Showcase (3246–3606)
  { text: "Every avatar is unique", startFrame: 3260, endFrame: 3370 },
  { text: "Every avatar performs", startFrame: 3380, endFrame: 3590 },

  // Closing (3588–4050)
  { text: "Create. Share. Get Paid.", startFrame: 3610, endFrame: 3780 },
  { text: "The future of music starts here", startFrame: 3800, endFrame: 4000 },
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
