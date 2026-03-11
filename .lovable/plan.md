

# Add "Auto-Generate Lyrics" Button to KaraokeSection

## What
Add a button in the KaraokeSection component that calls the `whisper-transcribe` edge function to auto-generate timed LRC lyrics from the track's audio. This works for existing tracks (TrackEdit) where an `audio_url` and `track_id` are available.

## Changes

### 1. Update KaraokeSection props and UI
- Add optional props: `trackId`, `audioUrl`, `onAutoGenerate`
- Add a "Auto-Generate Lyrics" button (with Sparkles icon) next to the "Import LRC" button in the lyrics header
- Show loading spinner during transcription
- On success, populate the lyrics textarea and switch to LRC tab

### 2. Create `useWhisperTranscribe` hook
- New file `src/hooks/useWhisperTranscribe.ts`
- Calls `supabase.functions.invoke('whisper-transcribe', { body: { track_id, audio_url } })`
- Returns `{ transcribe, isTranscribing }` 
- On success, returns the LRC lyrics string

### 3. Wire up in TrackEdit page
- Import KaraokeSection into TrackEdit (it currently manages karaoke inline)
- Pass `trackId` and `audioUrl` to KaraokeSection so the auto-generate button appears for saved tracks

### 4. Upload page behavior
- On Upload page, the track doesn't exist yet, so `trackId`/`audioUrl` won't be passed
- The auto-generate button simply won't render (no track to transcribe yet)
- Artists can still manually enter or import LRC lyrics during upload

## Technical Notes
- The edge function already saves lyrics to `track_karaoke` table and returns them
- No database changes needed
- No new secrets needed (OPENAI_API_KEY already configured)

