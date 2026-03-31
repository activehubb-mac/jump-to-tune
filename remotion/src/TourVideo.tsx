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

const T = 15;

// Scene durations (total ~2400 frames = 80s at 30fps):
// Intro: 270, Homepage: 330, GrowMyMusic: 420, Upload: 360, GoDJ: 360, Earnings: 330, Closing: 420
// With 6 transitions of 15 frames: 2490 - 90 = 2400

export const TourVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Voiceover audio */}
      <Audio src={staticFile("voiceover/narration.mp3")} volume={1} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={270}>
          <TourIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={330}>
          <TourHomepage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={420}>
          <TourGrowMyMusic />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <TourUpload />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <TourGoDJ />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={330}>
          <TourEarnings />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={420}>
          <TourClosing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent caption overlay */}
      <TourCaptionOverlay />
    </AbsoluteFill>
  );
};
