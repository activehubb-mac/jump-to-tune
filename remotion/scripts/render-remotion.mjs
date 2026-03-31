import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});
console.log("Bundle complete:", bundled);

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const compositionId = process.argv[2] || "tour";
console.log(`Selecting composition: ${compositionId}...`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: compositionId,
  puppeteerInstance: browser,
});
console.log("Composition:", composition.width, "x", composition.height, "@", composition.fps, "fps", composition.durationInFrames, "frames");

const finalOutput = process.argv[3] || (compositionId === "main" ? "/mnt/documents/jumtunes-demo-v4.mp4" : "/mnt/documents/jumtunes-tour.mp4");
const silentOutput = finalOutput.replace(".mp4", "-silent.mp4");

console.log(`Rendering silent video to ${silentOutput}...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: silentOutput,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  crf: 18,
});
console.log("Silent render complete!");
await browser.close({ silent: false });

// Mux audio with ffmpeg
const audioPath = path.resolve(__dirname, "../public/voiceover/demo-narration.mp3");
console.log(`Muxing audio from ${audioPath}...`);
try {
  execSync(`ffmpeg -y -i "${silentOutput}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${finalOutput}"`, { stdio: "inherit" });
  execSync(`rm "${silentOutput}"`);
  console.log(`Final output with audio: ${finalOutput}`);
} catch (e) {
  console.error("Audio mux failed, using silent version:", e.message);
  execSync(`mv "${silentOutput}" "${finalOutput}"`);
}
