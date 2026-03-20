

## Real AI Video Generation Pipeline + UX Polish

### Overview
Wire up Replicate's video generation model in the existing `ai-video-generator` edge function, add a storage bucket for output, poll for completion, update job status in real-time, and enhance the UI with progress indicators and notifications.

### Architecture

```text
User clicks Generate
       │
       ▼
ai-video-generator (edge function)
  ├── deduct credits (existing)
  ├── insert job as "queued" (existing)
  ├── call Replicate API → create prediction
  ├── update job → "processing" + store prediction_id
  ├── poll Replicate (every 5s, max 120 polls = 10 min)
  ├── on success: download video → upload to "ai-videos" bucket
  ├── update job → "completed" + output_url
  ├── send push notification
  └── on failure: refund credits, mark "failed"

Frontend polls ai_video_jobs every 5s while any job is processing
```

### Changes

#### 1. Storage bucket: `ai-videos` (new migration)
- Create a public bucket for generated video files
- Add storage policies for authenticated users to read their own videos

#### 2. `supabase/functions/ai-video-generator/index.ts` (rewrite)
- After inserting the job, call Replicate API with `minimax/video-01-live` model
- Map style + scene_prompt into a rich text prompt for the model
- Poll Replicate prediction status (5s interval, max 10 min timeout)
- On success: download output video, upload to `ai-videos` bucket, update job with `output_url` and `status: "completed"`
- On failure/timeout: refund AI credits, update job `status: "failed"`
- Send push notification on completion via existing `send-push-notification` function
- Refund credits atomically on any failure after deduction

#### 3. `src/hooks/useVideoStudio.ts` (modify)
- Increase poll interval: refetch every 5s when any job has status `queued` or `processing`, otherwise 30s
- Add a `deleteJob` mutation for clearing failed jobs

#### 4. `src/pages/AIVideoStudio.tsx` (modify)
- Show a pulsing progress indicator for `processing` jobs
- Add "Retry" button on failed jobs
- Add "Delete" option for failed jobs
- Show estimated time remaining based on duration selection
- Toast notification when a job transitions to `completed`

### Model Selection
Using `minimax/video-01-live` on Replicate — fast video generation (~2-4 min for short clips), accepts text prompts, outputs MP4. The prompt will combine the selected style preset with the user's scene prompt.

### Safety
- Credits are deducted before Replicate call (existing)
- Credits are refunded if Replicate fails or times out
- Edge function timeout is handled by polling loop (not blocking indefinitely)
- No changes to auth, RLS, or billing logic

### Files
- New migration: create `ai-videos` storage bucket
- `supabase/functions/ai-video-generator/index.ts` — add Replicate integration + polling + upload
- `src/hooks/useVideoStudio.ts` — adaptive polling interval
- `src/pages/AIVideoStudio.tsx` — progress UI + retry/delete for failed jobs

