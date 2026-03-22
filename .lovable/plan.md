

## Fix: Use User's Avatar Image in Video Generation

### Problem
The Video Studio receives the user's `avatar_url` from URL params and saved identities but never sends it to the backend. The edge function uses `minimax/video-01` (text-to-video only), which generates a random character from the text prompt. The user's actual avatar is completely ignored.

### Solution
When an avatar URL is available, switch to `minimax/video-01-live` (image-to-video model) and pass the avatar as `first_frame_image`. This makes the generated video start from and resemble the user's actual avatar.

### Changes

#### 1. `src/pages/AIVideoStudio.tsx` — Pass avatar URL to generate call

Track the selected avatar URL in state (from URL params and from the saved identities picker). Pass it as `avatar_url` in the `generate()` call body alongside the existing params.

Lines affected: ~195-210 (store avatarUrl in state), ~244-254 (pass to generate), ~330-360 (identity picker onClick sets avatarUrl).

#### 2. `src/hooks/useVideoStudio.ts` — Forward `avatar_url` to edge function

Add `avatar_url?: string` to the generate mutation's param type and include it in the `supabase.functions.invoke` body.

#### 3. `supabase/functions/ai-video-generator/index.ts` — Use image-to-video model when avatar provided

- Read `avatar_url` from the request