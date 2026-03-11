

## Problem

Both `ParticleBackground.tsx` and `PromotedAvatars.tsx` import `useAudioPlayer` from the AudioPlayerContext. Even though neither component actually uses any values from it (the `animationPlayState` logic was never completed), the import alone subscribes them to context updates. The AudioPlayerContext updates `currentTime` roughly 4 times per second during playback, causing rapid re-renders of these heavy components — making the 5 performer videos and all floating elements thrash and stutter.

## Fix

**Remove the unused `useAudioPlayer` import from both files.** That's it — one line deleted from each file. This stops the re-render storm entirely.

### Files to modify

1. **`src/components/effects/ParticleBackground.tsx`** — Delete line 4 (`import { useAudioPlayer } from "@/contexts/AudioPlayerContext";`)

2. **`src/components/effects/PromotedAvatars.tsx`** — Delete line 4 (`import { useAudioPlayer } from "@/contexts/AudioPlayerContext";`)

No other changes needed. The components don't reference any audio state — the import is purely vestigial from the earlier cancelled edit.

