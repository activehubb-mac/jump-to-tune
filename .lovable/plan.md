

# Pro Mode Voice Overlay with Auto-Ducking

## Overview
Add a second audio layer for voice clips in Pro mode sessions. During playback, when `session.mode === "pro"`, voice segments with `overlay_start_sec` values will play simultaneously over the currently-playing track, with the music volume automatically ducked. Standard mode remains unchanged (sequential playback only).

No changes to the existing JumTunes main player. All changes are scoped to the two Go DJ playback components.

## Architecture

The current playback in both `MixPreviewPlayer` and `GoDJMixPlayback` uses a single `HTMLAudioElement` and plays segments one after another. Pro mode requires:

1. A **second** `<audio>` element dedicated to voice clips
2. A **polling loop** that checks `mainAudio.currentTime` against voice overlay trigger points
3. **Volume ducking** via direct `.volume` property transitions (simpler and more compatible than Web Audio API `GainNode` for this use case)
4. A **trigger tracking set** to prevent re-firing the same overlay

```text
Standard Mode (unchanged):
  [Track1] -> [Voice1] -> [Track2] -> [Voice2] -> ...

Pro Mode (new):
  [Track1]----[Track2]----[Track3]----...
       ^          ^
    Voice1     Voice2  (overlaid at overlay_start_sec)
    (music ducks to 0.35 while voice plays)
```

## Changes

### 1. New utility: `src/lib/duckingEngine.ts`

A small, pure-logic module that manages voice overlay scheduling. This keeps the playback components clean.

**Exports:**
- `DuckingEngine` class with:
  - `constructor(mainAudio, voiceAudio, segments, voiceClipData, options)` -- `options` includes `duckLevel` (default 0.35), `fadeDurationMs` (default 300)
  - `start()` -- begins polling `mainAudio.currentTime` every 100ms
  - `stop()` -- clears interval, resets state
  - `resetTriggers()` -- clears the "already triggered" set (called on seek/restart)
  - `onVoiceStart` / `onVoiceEnd` callbacks for UI updates (e.g., showing "DJ talking" indicator)

**Internal logic:**
- Filters segments to only voice segments with non-null `overlay_start_sec`
- On each poll tick, checks if `mainAudio.currentTime >= overlay.overlay_start_sec` and overlay hasn't been triggered yet
- When triggered:
  - Marks overlay as triggered
  - If another voice is already playing, skips (no stacking)
  - Smoothly reduces `mainAudio.volume` from 1.0 to `duckLevel` over `fadeDurationMs` using `requestAnimationFrame`
  - Sets `voiceAudio.src` to the clip URL and plays it
  - If `ducking_enabled === false` on the segment, skips the volume reduction
- When `voiceAudio` fires `ended`:
  - Smoothly restores `mainAudio.volume` to 1.0 over `fadeDurationMs`
  - Clears "voice playing" flag
- Error handling: if voice clip fails to load (`error` event), immediately restore volume and skip

**Volume fade helper** (internal):
- Uses `requestAnimationFrame` loop stepping volume in increments over the fade duration
- Ease-in-out approximation via simple linear interpolation (sufficient for 300ms)

### 2. Update: `src/components/godj-mix/MixPreviewPlayer.tsx`

**Changes:**
- Add a second `<audio ref={voiceAudioRef}>` element (hidden)
- Accept `sessionMode: string` prop (from parent MixBuilder)
- When `sessionMode === "pro"`:
  - During track segment playback, instantiate `DuckingEngine` with the current track's voice overlays
  - Voice segments in the timeline with `overlay_start_sec` set are NOT played sequentially -- they are handled by the ducking engine
  - Voice segments WITHOUT `overlay_start_sec` (or in standard mode) continue to play sequentially as today
- When segment changes or playback stops, call `engine.stop()`
- Add a small "DJ Drop" indicator text when voice is actively playing over music

**Standard mode behavior** remains completely unchanged -- sequential playback as-is.

### 3. Update: `src/pages/GoDJMixPlayback.tsx`

**Changes:**
- Add a second `<audio ref={voiceAudioRef}>` element (hidden)
- Read `session.mode` from the session data
- When `session.mode === "pro"`:
  - During track segment playback, create `DuckingEngine` to monitor and trigger voice overlays
  - Pro mode voice segments are excluded from the sequential chapter list (they overlay, not interrupt)
  - In the tracklist/chapters UI, pro voice overlays show with a small "overlay" badge and their trigger timestamp instead of a sequential position
- `handleSeekToChapter`:
  - When seeking to a chapter, call `engine.resetTriggers()` so overlays that haven't been passed yet can re-trigger
  - Voice overlays whose `overlay_start_sec` is before the seek point are marked as already triggered
- Add a visual "DJ talking" indicator (small animated badge near the play button) when voice is actively playing

**Chapter calculation update for Pro mode:**
- Pro voice segments should NOT add to cumulative timeline duration (they overlay, they don't extend)
- Only track segments and standard-mode voice segments contribute to total duration
- Pro voice overlays appear in the tracklist with their `overlay_start_sec` timestamp relative to the track they overlay

### 4. No database changes needed

The `go_dj_segments` table already has all required fields:
- `overlay_start_sec` (integer, nullable)
- `overlay_end_sec` (integer, nullable)
- `voice_volume` (integer, default 100)
- `ducking_enabled` (boolean, default true)
- `ducking_db` (integer, default -10)

The `go_dj_sessions` table already has `mode` (text: 'standard' | 'pro').

### 5. No changes to existing JumTunes player

The global `AudioPlayerContext` and all related player UI components remain untouched.

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User seeks backward past a voice trigger | `resetTriggers()` called, overlays can fire again |
| Voice clip fails to load | `error` event on voice audio -> skip clip, restore volume |
| `ducking_enabled = false` | Voice plays at full volume, music volume stays at 1.0 |
| Multiple overlays at same timestamp | Only one plays (no stacking), next triggers after current ends |
| Track ends while voice is playing | Voice continues playing, volume restored when voice ends, then next segment starts |
| Standard mode session | Zero changes to current behavior, ducking engine not instantiated |

## Files Summary

### New Files (1)
- `src/lib/duckingEngine.ts` -- Standalone ducking/overlay scheduling logic

### Modified Files (2)
- `src/components/godj-mix/MixPreviewPlayer.tsx` -- Add voice audio element, integrate ducking engine for pro mode
- `src/pages/GoDJMixPlayback.tsx` -- Add voice audio element, integrate ducking engine, update chapter display for pro overlays

