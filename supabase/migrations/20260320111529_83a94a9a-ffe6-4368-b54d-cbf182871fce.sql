
CREATE TABLE public.ai_video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  video_type text NOT NULL DEFAULT 'music_video',
  export_format text NOT NULL DEFAULT '9:16',
  duration_seconds integer NOT NULL DEFAULT 30,
  scene_prompt text,
  style text NOT NULL DEFAULT 'cyberpunk',
  status text NOT NULL DEFAULT 'queued',
  credits_used numeric NOT NULL DEFAULT 0,
  output_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.ai_video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video jobs"
  ON public.ai_video_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own video jobs"
  ON public.ai_video_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_ai_video_jobs_user ON public.ai_video_jobs(user_id);
CREATE INDEX idx_ai_video_jobs_track ON public.ai_video_jobs(track_id);
CREATE INDEX idx_ai_video_jobs_status ON public.ai_video_jobs(status);
