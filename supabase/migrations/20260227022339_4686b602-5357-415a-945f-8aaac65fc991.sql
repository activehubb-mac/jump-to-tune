
-- =============================================
-- Go DJ Mix Builder: Full Schema
-- =============================================

-- 1. go_dj_profiles
CREATE TABLE public.go_dj_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  enabled_at timestamptz,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.go_dj_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own DJ profile"
  ON public.go_dj_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read enabled DJ profiles"
  ON public.go_dj_profiles FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Service role can manage DJ profiles"
  ON public.go_dj_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. go_dj_sessions
CREATE TABLE public.go_dj_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  visibility text NOT NULL DEFAULT 'public',
  mode text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'draft',
  mix_audio_url text,
  duration_sec integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.go_dj_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_go_dj_sessions_updated_at
  BEFORE UPDATE ON public.go_dj_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "DJs can manage own sessions"
  ON public.go_dj_sessions FOR ALL
  USING (auth.uid() = dj_user_id)
  WITH CHECK (auth.uid() = dj_user_id);

CREATE POLICY "Public can view published public sessions"
  ON public.go_dj_sessions FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Anyone can view published unlisted sessions by ID"
  ON public.go_dj_sessions FOR SELECT
  USING (status = 'published' AND visibility = 'unlisted');

CREATE POLICY "Service role can manage DJ sessions"
  ON public.go_dj_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. go_dj_voice_clips
CREATE TABLE public.go_dj_voice_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_user_id uuid NOT NULL,
  session_id uuid REFERENCES public.go_dj_sessions(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT 'Voice Clip',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.go_dj_voice_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DJs can manage own voice clips"
  ON public.go_dj_voice_clips FOR ALL
  USING (auth.uid() = dj_user_id)
  WITH CHECK (auth.uid() = dj_user_id);

CREATE POLICY "Public can read voice clips for published sessions"
  ON public.go_dj_voice_clips FOR SELECT
  USING (
    session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.go_dj_sessions
      WHERE id = go_dj_voice_clips.session_id AND status = 'published'
    )
  );

CREATE POLICY "Service role can manage voice clips"
  ON public.go_dj_voice_clips FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. go_dj_segments
CREATE TABLE public.go_dj_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.go_dj_sessions(id) ON DELETE CASCADE,
  segment_type text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  track_id uuid,
  voice_clip_id uuid REFERENCES public.go_dj_voice_clips(id) ON DELETE SET NULL,
  trim_start_sec integer NOT NULL DEFAULT 0,
  trim_end_sec integer,
  fade_in_sec numeric NOT NULL DEFAULT 0,
  fade_out_sec numeric NOT NULL DEFAULT 0,
  overlay_start_sec integer,
  overlay_end_sec integer,
  voice_volume integer NOT NULL DEFAULT 100,
  ducking_enabled boolean NOT NULL DEFAULT true,
  ducking_db integer NOT NULL DEFAULT -10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.go_dj_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session owners can manage segments"
  ON public.go_dj_segments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.go_dj_sessions
      WHERE id = go_dj_segments.session_id AND dj_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.go_dj_sessions
      WHERE id = go_dj_segments.session_id AND dj_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read segments for published sessions"
  ON public.go_dj_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.go_dj_sessions
      WHERE id = go_dj_segments.session_id AND status = 'published'
    )
  );

CREATE POLICY "Service role can manage segments"
  ON public.go_dj_segments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. go_dj_reactions
CREATE TABLE public.go_dj_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.go_dj_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE public.go_dj_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reactions"
  ON public.go_dj_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage own reactions"
  ON public.go_dj_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
  ON public.go_dj_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON public.go_dj_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reactions"
  ON public.go_dj_reactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6. go_dj_listens
CREATE TABLE public.go_dj_listens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.go_dj_sessions(id) ON DELETE CASCADE,
  user_id uuid,
  listened_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.go_dj_listens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert listens"
  ON public.go_dj_listens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read listens"
  ON public.go_dj_listens FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage listens"
  ON public.go_dj_listens FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('go-dj-voice', 'go-dj-voice', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('go-dj-mix-renders', 'go-dj-mix-renders', true);

-- Storage policies for go-dj-voice
CREATE POLICY "Anyone can read go-dj-voice files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'go-dj-voice');

CREATE POLICY "Authenticated users can upload to go-dj-voice"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'go-dj-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own go-dj-voice files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'go-dj-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for go-dj-mix-renders
CREATE POLICY "Anyone can read go-dj-mix-renders"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'go-dj-mix-renders');

CREATE POLICY "Authenticated users can upload to go-dj-mix-renders"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'go-dj-mix-renders' AND auth.uid()::text = (storage.foldername(name))[1]);
