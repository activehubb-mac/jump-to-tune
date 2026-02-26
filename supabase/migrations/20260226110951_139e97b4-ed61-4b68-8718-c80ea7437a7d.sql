
-- =============================================
-- GO DJ MODE - Database Foundation
-- =============================================

-- 1. DJ Sessions (core playlist/session table)
CREATE TABLE public.dj_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'active',
  gating text NOT NULL DEFAULT 'public',
  max_seats integer,
  sort_mode text NOT NULL DEFAULT 'manual',
  pinned_track_ids jsonb DEFAULT '[]'::jsonb,
  submissions_enabled boolean NOT NULL DEFAULT false,
  submission_price_cents integer NOT NULL DEFAULT 0,
  weekly_submission_cap integer,
  submission_guidelines text,
  refund_policy text,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active/scheduled sessions" ON public.dj_sessions
  FOR SELECT USING (status IN ('active', 'scheduled'));

CREATE POLICY "Artists can manage own sessions" ON public.dj_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Service role can manage sessions" ON public.dj_sessions
  FOR ALL USING (auth.role() = 'service_role'::text);

CREATE TRIGGER update_dj_sessions_updated_at
  BEFORE UPDATE ON public.dj_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. DJ Session Tracks
CREATE TABLE public.dj_session_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.dj_sessions(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  embed_url text,
  embed_type text NOT NULL DEFAULT 'jumtunes',
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_session_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view session tracks" ON public.dj_session_tracks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_session_tracks.session_id AND status IN ('active', 'scheduled')
  ));

CREATE POLICY "Session owners can manage tracks" ON public.dj_session_tracks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_session_tracks.session_id AND artist_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_session_tracks.session_id AND artist_id = auth.uid()
  ));

CREATE POLICY "Service role can manage session tracks" ON public.dj_session_tracks
  FOR ALL USING (auth.role() = 'service_role'::text);

-- 3. DJ Session Listeners (verified listener tracking)
CREATE TABLE public.dj_session_listeners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.dj_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  listened_seconds integer NOT NULL DEFAULT 0,
  counted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.dj_session_listeners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listener records" ON public.dj_session_listeners
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listener records" ON public.dj_session_listeners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listener records" ON public.dj_session_listeners
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Session owners can view listeners" ON public.dj_session_listeners
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_session_listeners.session_id AND artist_id = auth.uid()
  ));

CREATE POLICY "Service role can manage listeners" ON public.dj_session_listeners
  FOR ALL USING (auth.role() = 'service_role'::text);

-- 4. DJ Tiers (per-artist tier tracking)
CREATE TABLE public.dj_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE,
  lifetime_listeners integer NOT NULL DEFAULT 0,
  current_tier integer NOT NULL DEFAULT 1,
  max_slots integer NOT NULL DEFAULT 1,
  badge_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tiers" ON public.dj_tiers
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage tiers" ON public.dj_tiers
  FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "Artists can insert own tier" ON public.dj_tiers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Admins can manage tiers" ON public.dj_tiers
  FOR ALL TO authenticated USING (has_admin_role(auth.uid()));

CREATE TRIGGER update_dj_tiers_updated_at
  BEFORE UPDATE ON public.dj_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. DJ Submissions
CREATE TABLE public.dj_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.dj_sessions(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  featured_at timestamptz,
  min_feature_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submitters can view own submissions" ON public.dj_submissions
  FOR SELECT TO authenticated USING (auth.uid() = submitter_id);

CREATE POLICY "Submitters can insert submissions" ON public.dj_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Session owners can view submissions" ON public.dj_submissions
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_submissions.session_id AND artist_id = auth.uid()
  ));

CREATE POLICY "Session owners can update submissions" ON public.dj_submissions
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.dj_sessions WHERE id = dj_submissions.session_id AND artist_id = auth.uid()
  ));

CREATE POLICY "Service role can manage submissions" ON public.dj_submissions
  FOR ALL USING (auth.role() = 'service_role'::text);

-- 6. DJ Reactions (no comments, just emoji reactions)
CREATE TABLE public.dj_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.dj_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('🔥', '🎧', '⭐', '🚀')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.dj_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reactions" ON public.dj_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reactions" ON public.dj_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" ON public.dj_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.dj_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reactions" ON public.dj_reactions
  FOR ALL USING (auth.role() = 'service_role'::text);

-- 7. DJ Leaderboard (cached)
CREATE TABLE public.dj_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  period text NOT NULL DEFAULT 'lifetime',
  listener_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  session_count integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read leaderboard" ON public.dj_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage leaderboard" ON public.dj_leaderboard
  FOR ALL USING (auth.role() = 'service_role'::text);

-- Indexes for performance
CREATE INDEX idx_dj_sessions_artist ON public.dj_sessions(artist_id);
CREATE INDEX idx_dj_sessions_status ON public.dj_sessions(status);
CREATE INDEX idx_dj_session_tracks_session ON public.dj_session_tracks(session_id);
CREATE INDEX idx_dj_session_listeners_session ON public.dj_session_listeners(session_id);
CREATE INDEX idx_dj_reactions_session ON public.dj_reactions(session_id);
CREATE INDEX idx_dj_leaderboard_period_rank ON public.dj_leaderboard(period, rank);
CREATE INDEX idx_dj_submissions_session ON public.dj_submissions(session_id);
