

## Fix: Video Generation Failing + Delete Not Working

### Root Causes Found

**1. Generation fails with 422**: The edge function calls `minimax/video-01-live`, which is an **image-to-video** model that requires `first_frame_image`. The function only sends a text prompt — no image. Fix: switch to `minimax/video-01` (the text-to-video variant) which accepts prompt-only input.

**2. Delete not working**: The `ai_video_jobs` table only has RLS policies for SELECT and INSERT. There is **no DELETE policy**, so the client-side delete call silently fails.

### Changes

#### 1. `supabase/functions/ai-video-generator/index.ts` — Fix model endpoint

Line 141: Change the Replicate API URL from:
```
https://api.replicate.com/v1/models/minimax/video-01-live/predictions
```
to:
```
https://api.replicate.com/v1/models/minimax/video-01/predictions
```

This is the text-to-video model that accepts `prompt` without requiring `first_frame_image`.

Also improve error messaging: parse the 422 body and surface the actual error to the user instead of just "Generation failed."

#### 2. New migration — Add DELETE + UPDATE RLS policies

```sql
CREATE POLICY "Users can delete own video jobs"
  ON public.ai_video_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own video jobs"
  ON public.ai_video_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

The UPDATE policy is also needed because the edge function uses the service role (which bypasses RLS), but adding it ensures future flexibility.

#### 3. Edge function redeploy required

After editing, the `ai-video-generator` function needs redeployment.

### Files

| File | Change |
|---|---|
| `supabase/functions/ai-video-generator/index.ts` | Switch model from `video-01-live` to `video-01` |
| New migration | Add DELETE + UPDATE RLS policies on `ai_video_jobs` |

### Not Touched
- Cover Art Generator — untouched
- Frontend Video Studio UI — no changes needed
- All other edge functions — untouched

