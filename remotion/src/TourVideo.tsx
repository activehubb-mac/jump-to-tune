import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { TourIntro } from "./tour-scenes/TourIntro";
import { TourHomepage } from "./tour-scenes/TourHomepage";
import { TourGrowMyMusic } from "./tour-scenes/TourGrowMyMusic";
import { TourUpload } from "./tour-scenes/TourUpload";
import { TourGoDJ } from "./tour-scenes/TourGoDJ";
import { TourEarnings } from "./tour-scenes/TourEarnings";
import { TourClosing } from "./tour-scenes/TourClosing";
import { TourCaptionOverlay } from "./tour-components/TourCaptionOverlay";

const T = 18;

// Re-timed to match narration flow (~77s = ~2310 frames at 30fps)
// Narration beats (from caption overlay):
//   0–420:     Intro (Welcome, ecosystem, let's tour)
//   420–700:   Homepage (trending, spotlight, AI discovery)
//   700–1060:  Grow My Music (tools, cover art, avatars, videos, karaoke)
//   1060–1300: Upload (upload, protection, Recording ID)
//   1300–1620: Go DJ (mix sessions, leaderboards, submissions)
//   1620–1920: Earnings (85%, free trial, credits)
//   1920–2310: Closing (Create. Share. Get paid.)
// Total with 6 transitions of 18 frames = 2490 - 108 = 2382 → pad closing

export const TourVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Voiceover audio */}
      <Audio src={staticFile("voiceover/narration.mp3")} volume={1} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={440}>
          <TourIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <TourHomepage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={380}>
          <TourGrowMyMusic />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={260}>
          <TourUpload />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={320}>
          <TourGoDJ />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={320}>
          <TourEarnings />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={470}>
          <TourClosing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent caption overlay */}
      <TourCaptionOverlay />
    </AbsoluteFill>
  );
};
