

## Plan: Remove Black Background from 5 Character Videos

The performer videos have plain black backgrounds. Since video formats don't support transparency, the fix is to use CSS `mix-blend-mode: screen` on the `<video>` elements. This blend mode makes black pixels fully transparent while keeping the lighter performer content visible — perfect for compositing over the dark cosmic background.

### Change

**`src/components/effects/ParticleBackground.tsx`** — Add `mix-blend-mode: screen` style to the `<video>` elements in the floating characters section. One line change.

