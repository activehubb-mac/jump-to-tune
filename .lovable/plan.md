

## Fix: Audio Not Playing in Generated Videos

### Problem
Replicate's minimax video models (video-01 and video-01-live) generate **silent video only** — they are visual AI models with no audio capability. The selected track is stored as `track_id` in the job record but is never merged into the final MP4. The downloaded video from Replicate has no audio track.

### Solution
Since ffmpeg is not available in Supabase edge functions, merging audio server-side is not feasible. Instead, we add **client-side synchronized playback**: when a completed video plays, the associated track audio plays alongside it automatically.

### Changes

#### 1. `src/pages/AIVideoStudio.tsx` — VideoJobCard: Add inline video player with synced audio

For completed jobs with `output_url`:
- Replace the "Download" link with an inline `<video>` player (with controls, muted by default)
- If `track_id` exists, look up the track's `audio_url` from `artistTracks` (already loaded)
- Add a hidden `<audio>` element with the track's audio URL
- On video play/pause/seek, sync the audio element (play/pause/currentTime)
- Keep the Download button below the player
- Show the track name below the video: "Playing with: [Track Title]"

**Key logic:**
```
const videoRef = useRef<HTMLVideoElement>(null);
const audioRef = useRef<HTMLAudioElement>(null);

// On video play → audio.play()
// On video pause → audio.pause()
// On video seeked → audio.currentTime = video.currentTime
```

#### 2. Pass `artistTracks` to `VideoJobCard`

Add `artistTracks` prop so the card can resolve `track_id` → `audio_url` and title.

### Files

| File | Change |
|---|---|
| `src/pages/AIVideoStudio.tsx` | Add synced video+audio player in VideoJobCard, pass artistTracks prop |

### Not Touched
- Edge functions (no changes)
- Video generation pipeline (no changes)
- All other pages and features

