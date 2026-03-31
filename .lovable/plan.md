
## Fix App Reload Loop + Rebuild Tour as a True Full-AI Platform Demo

### What I found
There are two separate issues:

1. **The app is stuck in a reload loop, which is why you can’t sign in**
   - `src/main.tsx` compares `__APP_BUILD_VERSION__` with `/version.json`
   - Your console logs show a permanent mismatch:
     - network version: `mndyzdp0`
     - bundle version: `mne1bhbd`
   - That triggers `nukeCachesAndReload()` over and over, so the page never settles enough to load auth

2. **The current tour video is too generic for what you want**
   - Timing is hard-coded and not aligned to narration
   - `TourGrowMyMusic.tsx` uses generic emoji cards instead of the real tabbed tool groups
   - The tour does not yet leverage your actual account assets even though usable assets already exist in Supabase:
     - real AI identity avatars from `artist_identities`
     - your real uploaded track (`Birthday`)
     - real generated avatar-performance videos from `ai_video_jobs`
     - real cover art from your track/profile setup

### Plan

#### 1) Fix the page loading / sign-in blocker first
Update the PWA version-check logic in `src/main.tsx` so version mismatch does **not** trap users in an infinite reload loop.

Implementation:
- Add a **single-attempt reload guard** in `sessionStorage`
- If the app already tried a forced refresh once during the session, stop reloading and render the app anyway
- Make the fallback behavior “render app + let SW update naturally” instead of repeatedly nuking caches
- Keep service worker updates, but prevent `controllerchange` / mismatch checks from causing endless refreshes

Likely files:
- `src/main.tsx`
- possibly `vite.config.ts` if the current version-file generation approach needs to be softened

Result:
- preview loads again
- `/auth` becomes reachable
- you can sign in normally

#### 2) Rebuild the tour around your real JumTunes assets
Use the actual platform data already tied to your account instead of generic placeholders.

Assets I will pull into the tour:
- your real AI artist identity image(s) from `artist_identities`
- your real track cover art from `tracks.cover_art_url`
- your real avatar-performance clip from `ai_video_jobs.output_url`
- real JumTunes logo and actual page screenshots/layouts

This avoids needing you to sign in just to fetch assets for the video build.

#### 3) Redesign the tour to feel like a full AI music platform walkthrough
Instead of a simple screenshot slideshow, rebuild it as a premium product tour with feature-by-feature storytelling:

```text
Intro
→ Homepage / discovery
→ Grow My Music hub
   → Go Viral
   → Build Your Artist
   → Grow Your Reach
→ AI Identity creation
→ Cover Art generation
→ Video Studio / avatar performance
→ Upload + protection
→ Go DJ
→ Earnings / credits / monetization
→ Closing brand statement
```

The key change: it will feel like one connected creator journey, not separate slides.

#### 4) Make “Grow My Music” detailed and accurate
Rewrite `TourGrowMyMusic.tsx` so it shows the real hub structure:

- **Go Viral**
  - Video Studio
  - Viral Generator
- **Build Your Artist**
  - Artist Drop
  - Identity Builder
  - Cover Art
  - Release Builder
- **Grow Your Reach**
  - Playlist Builder

Implementation approach:
- animate tab highlights
- zoom into each section of the real page
- use premium callout cards with the actual tool names and value props
- include your generated AI identity imagery inside the scene, not just the page shell

#### 5) Re-sync narration, captions, and scene lengths properly
The current `TourVideo.tsx` durations do not match the audio pacing.

I’ll:
- remap scene durations to the real narration beats
- update `TourCaptionOverlay.tsx` so captions line up exactly with what’s on screen
- add more mid-scene detail so the viewer always sees the feature being described
- remove the “too fast / too slow” feeling by making pacing consistent and editorial

#### 6) Upgrade the visuals so the tour feels elite
Refine the motion system across all tour scenes:
- slower camera pans on screenshots
- deliberate zoom-ins on specific UI areas
- richer gold/luxury overlays
- cleaner hierarchy for titles and callouts
- less generic floating badges, more product-detail framing
- use your real AI visuals as featured inserts so the platform looks alive and creator-driven

#### 7) Show the actual AI workflow using your account content
Add a short sequence that specifically demonstrates:
- AI identity/avatar already created from your account
- your real cover art
- your real generated performance video clip
- your actual track context

This will make the tour feel like a real JumTunes creator demo instead of a mockup.

### Files likely to change

| File | Change |
|---|---|
| `src/main.tsx` | Stop infinite PWA reload loop so app/auth can load |
| `vite.config.ts` | Possibly soften/update versioning behavior if needed |
| `remotion/src/TourVideo.tsx` | Re-time all scenes to narration |
| `remotion/src/tour-components/TourCaptionOverlay.tsx` | Re-sync captions to visuals |
| `remotion/src/tour-scenes/TourGrowMyMusic.tsx` | Full rewrite with real hub tabs/details |
| `remotion/src/tour-scenes/TourHomepage.tsx` | Better motion + product-detail framing |
| `remotion/src/tour-scenes/TourUpload.tsx` | More detailed upload/protection walkthrough |
| `remotion/src/tour-scenes/TourGoDJ.tsx` | Stronger feature storytelling |
| `remotion/src/tour-scenes/TourEarnings.tsx` | Monetization/credits visuals with cleaner pacing |
| `remotion/src/tour-scenes/TourIntro.tsx` | Stronger branded opening |
| `remotion/src/tour-scenes/TourClosing.tsx` | Premium finish using JumTunes branding |
| `remotion/public/...` | Real account-derived assets/screenshots used in the tour |

### Important note
You do **not** need to sign in first for me to plan the new tour content. I already found real AI-generated assets associated with your account in the connected Supabase data, so I can base the new tour on those while also fixing the login blocker.

### End result
After implementation, you’ll have:
1. a working preview again so sign-in loads normally
2. a rebuilt JumTunes tour that feels like a **full AI music platform walkthrough**
3. a more premium, detailed, and believable demo using **your real generated avatar/track/video assets**
