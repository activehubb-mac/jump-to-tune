

## Full AI-Guided Tour of JumTunes — Complete Rebuild

### Root Cause of 14-Second Video
The render script (`render-remotion.mjs` line 51) hardcodes `demo-narration.mp3` as the audio source for ALL compositions — including the tour. The tour's `narration.mp3` is only ~14 seconds of audio. The composition declares 2382 frames (79s) but `ffmpeg -shortest` truncates the output to match the shortest stream — the 14-second audio. Result: 14-second video.

### What This Rebuild Delivers
A **2.5-minute** (4500 frames at 30fps) cinematic walkthrough with:
- Full ElevenLabs narration (~150 seconds) covering every major feature
- 10 scenes using the user's uploaded AI avatar images throughout
- Proper audio muxing so video length matches narration

### Narration Script (for ElevenLabs TTS generation)

> Welcome to JumTunes — the first AI music interaction platform. This is where creators turn ideas into real music, real visuals, and real income. Let's take a full tour.
>
> The homepage is your command center. Trending tracks, featured artist spotlights, curated playlists — all powered by AI discovery. Find new music or get discovered.
>
> Grow My Music is the creative engine. Three powerful sections: Go Viral gives you the AI Video Studio and Viral Generator for TikTok and Reels clips. Build Your Artist includes the AI Identity Builder — create a stunning AI avatar from a selfie. Generate cover art, plan releases, and build your brand. Grow Your Reach helps you curate playlists and expand your audience.
>
> The AI Identity Builder transforms a simple photo into a professional animated artist avatar. Choose from Quick, Style, or Full generation modes — each producing unique, stunning results. Your avatar becomes the face of your music across JumTunes.
>
> The AI Video Studio brings your avatar to life. Generate cinematic music videos, lyric videos, or short-form viral clips — all synced to your music. Your AI identity performs in every video.
>
> Upload your music in seconds. Every track gets a unique Recording ID — JT-2025 format — with timestamp protection and hash verification. Your music is protected from day one.
>
> Go DJ is the curator economy. Build mix sessions, compete on leaderboards, and earn from fan submissions. DJs and curators become part of the ecosystem.
>
> Artists earn eighty-five percent of every sale. That's the highest split in the industry. Every new creator gets a thirty-day free trial and fifteen free AI credits to explore every tool.
>
> Create. Share. Get paid. This is JumTunes — the future of music starts here. Join us at jumtunes dot com.

### Scene Structure (10 scenes, ~4500 frames total)

| # | Scene | Frames | Content |
|---|---|---|---|
| 1 | Intro | 450 | Logo, tagline, avatar gallery showcase (user's uploaded images) |
| 2 | Homepage | 400 | Screenshot with scroll pan, discovery callouts |
| 3 | Grow My Music Hub | 500 | 3-phase tab walkthrough (Go Viral → Build Artist → Grow Reach) |
| 4 | AI Identity Builder | 500 | Before/after avatar transformation using uploaded images |
| 5 | AI Video Studio | 400 | Video generation showcase with avatar performing |
| 6 | Upload & Protection | 380 | Upload flow, Recording ID, protection badges |
| 7 | Go DJ | 380 | Mix sessions, leaderboards, equalizer bars |
| 8 | Earnings | 420 | 85% split counter, trial, credits |
| 9 | Avatar Showcase | 350 | Rotating gallery of all uploaded AI avatars |
| 10 | Closing | 400 | Create. Share. Get Paid. + jumtunes.com |

Total with 9 transitions (18 frames each): 4180 - 162 overlap = ~4018 frames. Pad closing to hit ~4500.

### Avatar Images Used Throughout
Copy all 7 uploaded images into `remotion/public/images/`:
- `avatar-flames.png` (close-up with flames background)
- `avatar-street.png` (full body street scene)
- `avatar-robot.png` (robot DJ performer)
- `avatar-male-singer.png` (male vocalist performing)
- `avatar-female-singer.png` (female vocalist)
- `avatar-braids-singer.png` (braids vocalist)
- `avatar-dj.png` (DJ at turntables)

These appear as:
- Floating gallery in Intro scene
- Before/after in Identity Builder scene
- Performing artist in Video Studio scene
- Full showcase gallery in Avatar Showcase scene
- Background accents in other scenes

### Technical Changes

| File | Change |
|---|---|
| `remotion/public/images/avatar-*.png` | 7 new files — copied from uploads |
| `remotion/public/voiceover/tour-narration.mp3` | New — full 2.5min ElevenLabs narration |
| `remotion/src/Root.tsx` | Update tour composition to ~4500 frames |
| `remotion/src/TourVideo.tsx` | 10 scenes, new Audio source pointing to `tour-narration.mp3` |
| `remotion/src/tour-scenes/TourIntro.tsx` | Rewrite — avatar gallery showcase |
| `remotion/src/tour-scenes/TourHomepage.tsx` | Enhanced with avatar accents |
| `remotion/src/tour-scenes/TourGrowMyMusic.tsx` | Expanded 3-phase hub walkthrough |
| `remotion/src/tour-scenes/TourIdentityBuilder.tsx` | New — avatar transformation scene |
| `remotion/src/tour-scenes/TourVideoStudio.tsx` | New — video generation with avatar |
| `remotion/src/tour-scenes/TourUpload.tsx` | Enhanced |
| `remotion/src/tour-scenes/TourGoDJ.tsx` | Enhanced with DJ avatar |
| `remotion/src/tour-scenes/TourEarnings.tsx` | Enhanced |
| `remotion/src/tour-scenes/TourAvatarShowcase.tsx` | New — rotating avatar gallery |
| `remotion/src/tour-scenes/TourClosing.tsx` | Rewrite with avatar accents |
| `remotion/src/tour-components/TourCaptionOverlay.tsx` | Full re-sync to new scene timings |
| `remotion/scripts/render-remotion.mjs` | Fix audio path: use `tour-narration.mp3` for tour comp, `demo-narration.mp3` for main comp |

### Output
`/mnt/documents/jumtunes-tour-v3.mp4` — 1920x1080, ~2.5 minutes, full narration, 10 detailed scenes with real AI avatars

