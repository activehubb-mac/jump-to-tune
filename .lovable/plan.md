

## Fix: Motion Upgrade Buttons — Route to Video Studio Instead of CSS Tricks

### Problem
Currently, "Animate — 80 credits" and "Cinematic — 200 credits" deduct credits and only swap CSS animation classes (slightly different zoom speed/glow). Users pay 80-200 credits and see no meaningful change. CSS cannot make a static image blink, breathe, or move realistically.

### Solution
Remove the client-side credit deduction from these buttons entirely. Instead, route users to the AI Video Studio with the avatar pre-loaded, where real video generation (via minimax/video-01-live) actually happens and credits are deducted by the video backend.

### Changes

#### 1. `src/pages/AIIdentityBuilder.tsx` — Rewire motion buttons

**Remove**: `handleMotionUpgrade` function, `motionConfirmOpen`/`pendingMotionTier`/`motionTier` state, the second `CreditConfirmModal`

**Replace the two buttons with**:
- **