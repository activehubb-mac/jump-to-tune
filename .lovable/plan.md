

# Automated Karaoke System with Replicate Stem Separation

## Overview
Enhance the existing karaoke system with **automatic stem separation** via Replicate's Demucs model. When an artist enables Karaoke Mode without uploading an instrumental, the system auto-generates vocal and instrumental stems. Also add karaoke analytics to the existing Artist Analytics page.

## What Already Exists
- `track_karaoke` table (track_id, instrumental_url, lyrics, sing_mode_enabled)
- `sing_mode_videos` table (user recordings)
- Whisper transcription edge function
- SingModeRecorder with camera/mic, watermarked export
- SingModeExport with download + share buttons
- KaraokeSection upload UI with manual instrumental upload + auto-generate lyrics

## Implementation Steps

### 1. Store Replicate API Key
Use the secrets tool to securely store `REPLICATE_API_KEY` as a Supabase secret.

### 2. Add `stem_separation_status` Column to `track_karaoke`
Track the async separation job status: `pending`, `processing`, `completed`, `failed`.

```sql
ALTER TABLE track_karaoke 
  ADD COLUMN stem_separation_status text DEFAULT NULL,
  ADD COLUMN vocals_url text DEFAULT NULL,
  ADD COLUMN replicate_prediction_id text DEFAULT NULL;
```

### 3. Create `stem-separation` Edge Function
New edge function that:
1. Accepts `track_id` and `audio_url`
2. Verifies track ownership
3. Calls Replicate API (`cjwbw/demucs`) to split audio
4. Polls for completion (or uses webhook)
5. Downloads the instrumental + vocals stems
6. Uploads them to Supabase storage (`instrumentals` bucket)
7. Updates `track_karaoke` with the URLs and status

### 4. Update Upload Flow (KaraokeSection + useTrackUpload)
- When Karaoke Mode is enabled but **no instrumental file is uploaded**, trigger the stem separation edge function after track creation
- Show a "Generating instrumental..." status indicator
- Update `track_karaoke.stem_separation_status` to track progress
- If an instrumental IS manually uploaded, skip separation (current behavior)

### 5. Add Separation Status UI
- In KaraokeSection: show processing status badge when separation is running
- On track detail pages: show "Karaoke generating..." indicator until complete
- Poll or use realtime subscription to update status

### 6. Add Karaoke Analytics Tab to Artist Analytics
Add a new section to `src/pages/ArtistAnalytics.tsx` showing:
- Total karaoke videos created (count from `sing_mode_videos` for artist's tracks)
- Fan recordings count
- Most popular karaoke track

### 7. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/stem-separation/index.ts` | **Create** - Replicate Demucs integration |
| `supabase/config.toml` | **Edit** - Add stem-separation function config |
| `src/hooks/useTrackUpload.ts` | **Edit** - Trigger separation when no instrumental provided |
| `src/components/upload/KaraokeSection.tsx` | **Edit** - Add "auto-generate instrumental" option + status |
| `src/hooks/useStemSeparation.ts` | **Create** - Hook to trigger/poll separation status |
| `src/pages/ArtistAnalytics.tsx` | **Edit** - Add karaoke stats section |
| `src/hooks/useKaraokeAnalytics.ts` | **Create** - Query karaoke video counts |
| Migration SQL | **Create** - Add columns to track_karaoke |

### Technical Details

**Replicate API Call:**
```
POST https://api.replicate.com/v1/predictions
Model: cjwbw/demucs
Input: { audio: <audio_url>, stem: "vocals" }  // Run twice for vocals + instrumental
```

**Cost:** ~$0.03-0.08 per track. No AI credits deducted from artist (this is infrastructure cost).

**Storage:** Stems stored in existing `instrumentals` bucket (private). Vocals stored alongside for potential future use.

