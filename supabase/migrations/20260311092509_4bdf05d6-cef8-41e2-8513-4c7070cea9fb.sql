
-- Autopilot sessions table to track generation progress
CREATE TABLE public.autopilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  prompt TEXT,
  credits_charged INTEGER NOT NULL DEFAULT 150,
  cover_art_url TEXT,
  video_url TEXT,
  avatar_url TEXT,
  lyric_visual_url TEXT,
  promo_clips JSONB DEFAULT '[]'::jsonb,
  progress JSONB DEFAULT '{"track_uploaded": true, "cover_art": "pending", "video": "pending", "avatar": "pending", "release_page": "pending", "karaoke": "pending", "lyric_visual": "pending", "promo_clips": "pending"}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.autopilot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own autopilot sessions"
  ON public.autopilot_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own autopilot sessions"
  ON public.autopilot_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own autopilot sessions"
  ON public.autopilot_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all autopilot sessions"
  ON public.autopilot_sessions FOR SELECT
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Index
CREATE INDEX idx_autopilot_sessions_user_id ON public.autopilot_sessions(user_id);
CREATE INDEX idx_autopilot_sessions_track_id ON public.autopilot_sessions(track_id);

-- Updated at trigger
CREATE TRIGGER update_autopilot_sessions_updated_at
  BEFORE UPDATE ON public.autopilot_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
