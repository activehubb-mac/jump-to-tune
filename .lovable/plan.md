

## Fix: Replicate API Call Using Wrong Endpoint

### Root Cause
The edge function posts to `https://api.replicate.com/v1/predictions` with `version: "minimax/video-01-live"`. This endpoint expects a 64-character version SHA hash, not a model slug. For official models like `minimax/video-01-live`, you must use the **models endpoint**:

```text
POST https://api.replicate.com/v1/models/minimax/video-01-live/predictions
```

No `version` field needed — the models endpoint automatically uses the latest version.

### Change

**File: `supabase/functions/ai-video-generator/index.ts`**

1. Change the Replicate API call from:
   ```
   POST https://api.replicate.com/v1/predictions
   body: { version: "minimax/video-01-live", input: { ... } }
   ```
   To:
   ```
   POST https://api.replicate.com/v1/models/minimax/video-01-live/predictions
   body: { input: { prompt: ..., prompt_optimizer: true } }
   ```

2. Remove the `version` field from the request body (not needed with models endpoint).

3. Keep the polling URL as-is (`/v1/predictions/{id}`) — that's correct for checking status.

That's the only change needed. Everything else (polling, upload, refund logic) stays the same.

### Files
- `supabase/functions/ai-video-generator/index.ts` — fix Replicate endpoint URL

