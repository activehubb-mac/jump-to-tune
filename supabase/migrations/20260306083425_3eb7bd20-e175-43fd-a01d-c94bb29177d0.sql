
-- Add sing_mode_enabled to track_karaoke
ALTER TABLE public.track_karaoke 
ADD COLUMN IF NOT EXISTS sing_mode_enabled boolean NOT NULL DEFAULT false;

-- Create sing_mode_videos table
CREATE TABLE public.sing_mode_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  video_url text,
  caption_text text,
  status text NOT NULL DEFAULT 'processing',
  is_featured boolean NOT NULL DEFAULT false,
  is_moderated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sing_mode_videos_user ON public.sing_mode_videos(user_id);
CREATE INDEX idx_sing_mode_videos_track ON public.sing_mode_videos(track_id);
CREATE INDEX idx_sing_mode_videos_featured ON public.sing_mode_videos(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.sing_mode_videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos
CREATE POLICY "Users can view own sing mode videos"
ON public.sing_mode_videos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own videos
CREATE POLICY "Users can insert own sing mode videos"
ON public.sing_mode_videos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own videos
CREATE POLICY "Users can delete own sing mode videos"
ON public.sing_mode_videos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Public can view featured videos
CREATE POLICY "Public can view featured sing mode videos"
ON public.sing_mode_videos FOR SELECT
USING (is_featured = true AND is_moderated = false);

-- Admins can manage all sing mode videos
CREATE POLICY "Admins can manage sing mode videos"
ON public.sing_mode_videos FOR ALL
TO authenticated
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

-- Service role full access
CREATE POLICY "Service role manages sing mode videos"
ON public.sing_mode_videos FOR ALL
USING (auth.role() = 'service_role');

-- Insert sing_mode credit cost
INSERT INTO public.ai_credit_costs (action_key, credit_cost, label, description, is_active)
VALUES ('sing_mode', 5, 'Sing Mode Recording', 'Record a karaoke sing-along video', true)
ON CONFLICT DO NOTHING;
