
-- Add stage mode columns to track_karaoke
ALTER TABLE public.track_karaoke 
  ADD COLUMN IF NOT EXISTS stage_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duet_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dance_mode_enabled boolean NOT NULL DEFAULT false;

-- Create stage_videos table
CREATE TABLE public.stage_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('sing', 'duet', 'dance')),
  video_url text,
  thumbnail_url text,
  caption_text text,
  template text DEFAULT 'spotlight',
  status text NOT NULL DEFAULT 'completed',
  is_featured boolean NOT NULL DEFAULT false,
  is_moderated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stage_videos ENABLE ROW LEVEL SECURITY;

-- Users can read their own videos
CREATE POLICY "Users can read own stage videos"
  ON public.stage_videos FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own videos
CREATE POLICY "Users can insert own stage videos"
  ON public.stage_videos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own videos
CREATE POLICY "Users can delete own stage videos"
  ON public.stage_videos FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Featured videos are publicly readable
CREATE POLICY "Featured stage videos are public"
  ON public.stage_videos FOR SELECT TO anon, authenticated
  USING (is_featured = true AND is_moderated = false);

-- Admins can read all stage videos
CREATE POLICY "Admins can read all stage videos"
  ON public.stage_videos FOR SELECT TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Admins can update stage videos
CREATE POLICY "Admins can update stage videos"
  ON public.stage_videos FOR UPDATE TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Admins can delete stage videos  
CREATE POLICY "Admins can delete stage videos"
  ON public.stage_videos FOR DELETE TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Index for performance
CREATE INDEX idx_stage_videos_user_id ON public.stage_videos(user_id);
CREATE INDEX idx_stage_videos_track_id ON public.stage_videos(track_id);
CREATE INDEX idx_stage_videos_featured ON public.stage_videos(is_featured) WHERE is_featured = true;
