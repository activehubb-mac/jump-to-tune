import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
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

const outputPath = process.argv[3] || "/mnt/documents/jumtunes-tour.mp4";
console.log(`Rendering to ${outputPath}...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outputPath,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  crf: 18,
});

console.log(`Render complete! Output: ${outputPath}`);
await browser.close({ silent: false });
