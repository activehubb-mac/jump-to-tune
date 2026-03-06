-- Viral content assets table
CREATE TABLE public.ai_viral_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'tiktok',
  style text NOT NULL DEFAULT 'abstract visualizer',
  duration_seconds integer NOT NULL DEFAULT 10,
  file_url text,
  caption_text text,
  hook_text text,
  hashtag_set text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_viral_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  credit_cost integer NOT NULL,
  generation_type text NOT NULL,
  duration_seconds integer NOT NULL,
  style text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_viral_assets_user ON public.ai_viral_assets(user_id);
CREATE INDEX idx_ai_viral_assets_track ON public.ai_viral_assets(track_id);
CREATE INDEX idx_ai_viral_gen_logs_user ON public.ai_viral_generation_logs(user_id);

ALTER TABLE public.ai_viral_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_viral_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own viral assets"
  ON public.ai_viral_assets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all viral assets"
  ON public.ai_viral_assets FOR SELECT TO authenticated
  USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Users read own generation logs"
  ON public.ai_viral_generation_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own generation logs"
  ON public.ai_viral_generation_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());