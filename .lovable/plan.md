

# AI-Generated Artwork for Placeholder Cards

## Overview
Use the Lovable AI Gateway's image generation model (`google/gemini-2.5-flash-image`) to create unique artwork for the Fan Zone and Create With AI section cards. Images are generated once via an edge function, cached in Supabase storage, and served as static URLs thereafter.

## Architecture

```text
Component loads → Check storage for cached image
  ├─ Found → Display cached image URL
  └─ Not found → Call edge function → Generate via AI → Upload to storage → Return URL
```

## Changes

### 1. New Edge Function: `supabase/functions/generate-card-artwork/index.ts`
- Accepts a `prompt` and `card_id` (e.g. `"fan-zone-dark-drill-cover"`)
- Checks if image already exists in `covers` bucket under `card-artwork/{card_id}.png`
- If not, calls Lovable AI Gateway with `google/gemini-2.5-flash-image` and the prompt
- Decodes the base64 response, uploads to storage, returns the public URL
- Uses `LOVABLE_API_KEY` (already configured)

### 2. New Hook: `src/hooks/useCardArtwork.ts`
- Takes a `cardId` and `prompt`
- Uses React Query to call the edge function
- Returns `{ imageUrl, isLoading }`
- Caches aggressively (`staleTime: Infinity`) since images don't change

### 3. Update `src/components/home/FanZoneSection.tsx`
- Add AI-generated prompts per card (e.g. "Dark moody studio with drill music aesthetic, neon purple lighting, microphone silhouette")
- Replace the blank `bg-muted/50` thumbnail with the generated image
- Show a skeleton/shimmer while loading
- Keep the play overlay and category badge on top

### 4. Update `src/components/home/CreateWithAISection.tsx`
- Add background artwork prompts per AI tool card (e.g. "Futuristic AI karaoke stage with holographic waveforms, dark theme")
- Display as a subtle background image behind the icon/text with a dark overlay
- Adds visual depth without cluttering the text

### Prompt Examples

| Card | Prompt |
|------|--------|
| Dark Drill Cover | "Dark moody recording studio, purple neon glow, microphone silhouette, cinematic, 9:16 portrait" |
| Chill R&B Remix | "Warm amber sunset skyline, vinyl record floating, smooth R&B aesthetic, dark mood" |
| AI Karaoke | "Futuristic holographic karaoke stage, AI waveforms, dark premium aesthetic, gold accents" |
| AI Remix | "Abstract sound wave visualization, neon circuits, dark background, music production" |

### Files
| File | Action |
|------|--------|
| `supabase/functions/generate-card-artwork/index.ts` | Create - edge function for AI image gen + storage caching |
| `src/hooks/useCardArtwork.ts` | Create - React Query hook for fetching/generating artwork |
| `src/components/home/FanZoneSection.tsx` | Edit - integrate generated artwork into cards |
| `src/components/home/CreateWithAISection.tsx` | Edit - add background artwork to AI tool cards |
| `supabase/config.toml` | Edit - add function config with `verify_jwt = false` |

