
ALTER TABLE public.track_karaoke
  ADD COLUMN IF NOT EXISTS rap_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_avatar_mode_enabled boolean NOT NULL DEFAULT false;
