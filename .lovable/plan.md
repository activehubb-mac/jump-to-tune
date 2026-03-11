

## Analysis

The background floating elements (performer videos, promoted avatars, instrument emojis, particles) use continuous CSS animations — they don't actually react to audio. However, their constant bouncing and drifting creates the visual impression of "dancing to music" when a track is playing.

The fix is to pause all background animations when audio is actively playing, so the background becomes static/calm during playback.

## Plan

### 1. Pass playback state to ParticleBackground and PromotedAvatars

In `src/components/layout/Layout.tsx`, read `isPlaying` from `useAudioPlayer()` and pass it down (or consume it directly in the effect components).

### 2. Pause animations in ParticleBackground when playing

In `src/components/effects/ParticleBackground.tsx`:
- Import `useAudioPlayer` and read `isPlaying`
- Add a CSS class or inline style `animationPlayState: isPlaying ? 'paused' : 'running'` to the root container div, which will cascade to all animated children (particles, characters, instruments, nebula orbs, featured avatars)

### 3. Pause animations in PromotedAvatars when playing

In `src/components/effects/PromotedAvatars.tsx`:
- Import `useAudioPlayer` and read `isPlaying`
- Apply `animationPlayState: 'paused'` to the container when audio is playing, stopping the fade-cycle and drift animations

### Files to modify
- `src/components/effects/ParticleBackground.tsx` — add `useAudioPlayer`, apply paused state to wrapper
- `src/components/effects/PromotedAvatars.tsx` — add `useAudioPlayer`, apply paused state to wrapper

