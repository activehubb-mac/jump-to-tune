

# Make All Cards & Panels Fully Opaque

## Problem
Despite fixing the `.glass-card` CSS classes, there are **34 files** across the codebase that still use semi-transparent backgrounds like `bg-card/50`, `bg-background/80`, `bg-card/20`, and `backdrop-blur` — letting the animated background bleed through cards, sections, overlays, sidebars, and panels.

## Plan

Perform a systematic sweep across all affected files, replacing semi-transparent card/panel backgrounds with fully opaque equivalents:

| Pattern | Replacement |
|---------|-------------|
| `bg-card/50`, `bg-card/80`, `bg-card/20` | `bg-card` |
| `bg-background/50`, `bg-background/80`, `bg-background/60` | `bg-background` |
| `bg-sidebar/80`, `bg-sidebar/90` | `bg-sidebar` |
| `backdrop-blur-xl`, `backdrop-blur-sm`, `backdrop-blur-md` on cards/panels | Remove (unnecessary when opaque) |

**Exceptions** (keep semi-transparent — these are intentional overlays, not cards):
- Hover overlays on images (`bg-black/50`, `bg-black/60` over artwork)
- Button overlays (`bg-destructive/80` on action buttons over images)
- Badges on images (small floating badges need some transparency)
- Modal backdrops (dimming layer behind dialogs)

### Files to modify (~20 key files):

| File | Change |
|------|--------|
| `src/components/browse/SpotifyTrackCard.tsx` | `bg-card/50` -> `bg-card` |
| `src/components/home/FanZoneSection.tsx` | `bg-card/20` -> `bg-card` |
| `src/components/home/FeaturedHeroCarousel.tsx` | `bg-card/80` -> `bg-card` |
| `src/components/audio/KaraokeLyricsPanel.tsx` | Remove `backdrop-blur-xl` |
| `src/components/ui/sidebar.tsx` | `bg-sidebar/80` -> `bg-sidebar`, `bg-sidebar/90` -> `bg-sidebar`, remove `backdrop-blur-xl` |
| `src/components/subscription/CheckoutLoadingOverlay.tsx` | Keep (modal backdrop — intentional) |
| `src/components/superfan/ExclusiveDrops.tsx` | Keep (image overlay — intentional) |
| `src/pages/Browse.tsx` | `bg-card/50` -> `bg-card` |
| `src/components/upload/AlbumTrackRow.tsx` | `bg-background/50` -> `bg-background` |
| `src/components/playlist/PlaylistCard.tsx` | Remove `backdrop-blur-sm` from badge |
| `src/components/dashboard/TrackCard.tsx` | `bg-background/80` -> `bg-background`, remove `backdrop-blur-sm` on edit/delete buttons |
| `src/components/browse/HeroCarousel.tsx` | `bg-background/80` -> `bg-background`, remove `backdrop-blur-sm` |
| `src/components/godj/SessionCard.tsx` | `bg-background/80` -> `bg-background` on badges, remove `backdrop-blur-sm` |
| `src/pages/GoDJSession.tsx` | `bg-background/80` -> `bg-background` on badges |
| `src/components/dashboard/AlbumSection.tsx` | `bg-background/80` -> `bg-background` |
| `src/components/wallet/LowBalanceWarningModal.tsx` | Remove `backdrop-blur-sm` from icon container |

This will ensure every card, panel, and section is fully solid — the animated cosmic background stays behind content where it belongs.

