
# JumTunes Recording Protection & Certification System

## What This Feature Does

This system creates a **legal audit trail** for every track uploaded to JumTunes. It proves that a specific audio file was uploaded by a specific user at a specific time, which protects artists' intellectual property and adds professionalism to the platform.

### Core Components:
1. **Audio Fingerprint (SHA-256 Hash)** -- A unique digital fingerprint generated from the raw audio file bytes. If anyone disputes ownership, you can prove "this exact file existed in our system on X date."
2. **JumTunes Recording ID** -- An internal ISRC-style identifier (e.g., `JT-2026-000001`) assigned to every upload, important for scaling and cataloging.
3. **Upload Audit Trail** -- Captures upload timestamp (UTC), uploader account ID, country (from browser), and rights declaration confirmation.
4. **Downloadable PDF Certificate** -- A "JumTunes Verified Recording Certificate" the artist can download, containing all the above information plus a formal statement.
5. **Blockchain Anchor (Future)** -- Noted as Phase 2/3, not part of this implementation.

---

## Who Uses This

### Artists and Labels (creators)
- Upload tracks and automatically get a Recording ID + fingerprint generated
- Can download their PDF certificate from the Track Detail view or Artist Dashboard
- The rights declaration checkbox they already check feeds into the audit trail

### Fans / Public
- Can see the JumTunes Recording ID displayed on track detail pages (adds trust and professionalism)
- Cannot download certificates -- that's only for the track owner

### Admins
- Can view all recording registrations and audit trails for dispute resolution

---

## Implementation Plan

### Phase 1: Database -- New `track_registrations` Table

A new table to store the fingerprint, recording ID, and audit data:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| track_id | uuid | FK to tracks |
| recording_id | text | e.g., "JT-2026-000001" (unique, auto-generated) |
| audio_hash | text | SHA-256 hex string of the audio file |
| uploaded_by | uuid | The user who uploaded |
| upload_timestamp | timestamptz | UTC time of upload |
| country | text | From browser locale/timezone (best effort) |
| rights_confirmed | boolean | Whether the rights checkbox was checked |
| created_at | timestamptz | Row creation time |

Also add a database function to auto-generate the next sequential Recording ID in `JT-YYYY-NNNNNN` format.

RLS policies:
- Artists/Labels can SELECT their own registrations (via track ownership)
- Admins can SELECT all registrations
- INSERT only via service role or the track owner
- Public can SELECT recording_id only (via a view or by joining on published tracks)

### Phase 2: Client-Side SHA-256 Hashing

Add a utility function in `src/lib/audioUtils.ts` that uses the browser's built-in `crypto.subtle.digest('SHA-256', ...)` API to hash the audio file bytes before upload. This runs entirely in the browser -- no server needed.

### Phase 3: Update Upload Hooks

Modify `useTrackUpload.ts` and `useAlbumUpload.ts`:
- After the track is inserted into the `tracks` table, insert a row into `track_registrations`
- Generate the SHA-256 hash from the audio file before uploading
- Capture the user's country from `Intl.DateTimeFormat().resolvedOptions().timeZone` (best effort)
- Pass the rights confirmation status

### Phase 4: PDF Certificate Generation (Edge Function)

Create a new edge function `generate-certificate` that:
- Accepts a track_id
- Verifies the requesting user owns the track
- Fetches the registration data (recording ID, hash, timestamp, artist name, track title)
- Generates a simple HTML-to-PDF certificate containing:
  - Artist Name
  - Song Title
  - JumTunes Recording ID
  - SHA-256 Fingerprint
  - Upload Timestamp
  - Statement: "This recording was uploaded to JumTunes on [Date]."
- Returns the PDF for download

### Phase 5: UI Integration

**Track Detail Modal (`TrackDetailModal.tsx`):**
- Show the JumTunes Recording ID as a badge/label
- Add a "Download Certificate" button (only visible to track owner)

**Artist Dashboard / Track Cards:**
- Show the Recording ID on each track card
- Quick-access certificate download button

**Upload Success Screen:**
- After successful upload, show the generated Recording ID
- Offer immediate certificate download

---

## Technical Details

### SHA-256 Hashing (Browser-Side)
```text
File -> ArrayBuffer -> crypto.subtle.digest('SHA-256') -> hex string
```
No external libraries needed -- uses the Web Crypto API built into all modern browsers.

### Recording ID Format
```text
JT-{YEAR}-{6-digit sequential number}
Examples: JT-2026-000001, JT-2026-000002
```
Generated server-side via a database sequence to guarantee uniqueness.

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/audioUtils.ts` | Add `generateAudioHash()` function |
| `supabase/functions/generate-certificate/index.ts` | PDF certificate generation edge function |

### Files to Modify
| File | Changes |
|------|---------|
| `src/hooks/useTrackUpload.ts` | Hash audio, insert registration after track creation |
| `src/hooks/useAlbumUpload.ts` | Same for album track uploads |
| `src/components/dashboard/TrackDetailModal.tsx` | Display Recording ID + download certificate button |
| `src/components/dashboard/TrackCard.tsx` | Show Recording ID |
| `src/pages/Upload.tsx` | Pass rights confirmation to upload hook, show Recording ID on success |
| `supabase/config.toml` | Register new edge function |

### Database Migration
- Create `track_registrations` table
- Create `recording_id_seq` sequence
- Create `generate_recording_id()` function
- Add RLS policies

### Implementation Order
1. Database migration (table + sequence + function + RLS)
2. Add SHA-256 hash utility to `audioUtils.ts`
3. Update `useTrackUpload.ts` to generate hash and insert registration
4. Update `useAlbumUpload.ts` with same logic
5. Create `generate-certificate` edge function
6. Update `TrackDetailModal` and `TrackCard` to show Recording ID and download button
7. Update Upload success flow to display the new Recording ID
