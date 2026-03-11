

## Plan: Admin-Controlled Go DJ Background Video

### Overview
Turn the Go DJ page background video into an admin-manageable promotional tool. Admins can upload/swap short DJ promo videos from the Admin Dashboard, and the Go DJ page dynamically loads the active video.

### Database Changes

**New table: `godj_backgrounds`**
- `id` (uuid, PK)
- `title` (text) — label for the admin UI
- `video_url` (text) — public URL from storage
- `is_active` (boolean, default false) — only one active at a time
- `playback_rate` (numeric, default 0.8)
- `overlay_opacity` (numeric, default 60) — the bg-background overlay %
- `created_at`, `updated_at`

RLS: public read, admin write. A unique partial index on `is_active = true` ensures only one active background.

**Storage**: Use the existing public `covers` bucket or create a new `godj-backgrounds` public bucket for the video files.

### Frontend Changes

1. **New hook: `src/hooks/useGoDJBackground.ts`**
   - Queries `godj_backgrounds` for the row where `is_active = true`
   - Returns `{ videoUrl, playbackRate, overlayOpacity }`
   - Falls back to `/videos/godj-bg.mov` if no active row

2. **`src/pages/GoDJ.tsx`**
   - Use the new hook instead of the hardcoded video path
   - Apply dynamic `playbackRate` and overlay opacity from the active record

3. **New admin tab section in `src/pages/admin/AdminHome.tsx`** (or a dedicated GoDJ admin card)
   - Card titled "Go DJ Background"
   - Lists all uploaded backgrounds with thumbnails (video poster or filename)
   - "Upload New" button — file input accepting `.mp4, .mov, .webm`
   - Uploads to `godj-backgrounds` storage bucket
   - Radio/switch to set which video is active
   - Playback rate slider (0.5–1.0)
   - Overlay opacity slider (30–80%)
   - Delete button per video

4. **New storage bucket migration**: `godj-backgrounds` (public)

### File Summary
| File | Action |
|------|--------|
| `supabase/migrations/new.sql` | Create `godj_backgrounds` table, bucket, RLS, seed current video |
| `src/hooks/useGoDJBackground.ts` | New hook to fetch active background |
| `src/pages/GoDJ.tsx` | Use hook instead of hardcoded path |
| `src/pages/admin/AdminHome.tsx` | Add Go DJ Background management card |

