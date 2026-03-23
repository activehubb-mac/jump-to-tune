

## Add AI Video Studio Card to Create With AI Section

### Overview
Add a sixth card to the existing `aiTools` array in `CreateWithAISection.tsx`. The card reuses the existing `AIToolCard` component — no new components needed. Copy the uploaded `.mov` file to `public/videos/` for use as the card's background video.

---

### Changes

**Step 1: Copy uploaded video**
- Copy `user-uploads://928aa056-6344-4ec4-a1c5-ededaf4574e4.mov` → `public/videos/ai-video-studio.mov`

**Step 2: Add card entry** — `src/components/home/CreateWithAISection.tsx`

Add to the `aiTools` array (after AI Cover Art, line 56):

```js
{
  title: "AI Video Studio",
  description: "Generate cinematic AI music videos synced to your track",
  icon: Clapperboard,  // from lucide-react
  href: "/ai-video",
  gradient: "from-primary/20 to-accent/20",
  glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
  videoSrc: "/videos/ai-video-studio.mov",
  playbackRate: 0.5,
}
```

Import `Clapperboard` from `lucide-react`.

That's it — the existing `AIToolCard` component handles autoplay, muted loop, hover zoom (scale 1.05), glow, dark overlay, responsive aspect ratio, and mobile playsInline. The 3-column grid naturally accommodates the 6th card (2 rows of 3).

---

### Files Changed

| File | Change |
|---|---|
| `public/videos/ai-video-studio.mov` | New — uploaded video asset |
| `src/components/home/CreateWithAISection.tsx` | Add Clapperboard import + AI Video Studio entry to aiTools array |

### Not Touched
- AIToolCard component logic, layout grid, pricing, credit system, other cards

