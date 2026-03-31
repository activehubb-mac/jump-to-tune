import { Composition } from "remotion";
import { TourVideo } from "./TourVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="tour"
      component={TourVideo}
      durationInFrames={2400}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
