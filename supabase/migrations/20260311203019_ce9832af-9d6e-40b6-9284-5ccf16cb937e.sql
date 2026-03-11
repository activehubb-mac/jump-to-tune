
-- Create godj_backgrounds table
CREATE TABLE public.godj_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  video_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  playback_rate numeric NOT NULL DEFAULT 0.8,
  overlay_opacity numeric NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active background at a time
CREATE UNIQUE INDEX godj_backgrounds_active_idx ON public.godj_backgrounds (is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER set_godj_backgrounds_updated_at
  BEFORE UPDATE ON public.godj_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.godj_backgrounds ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read godj_backgrounds"
  ON public.godj_backgrounds FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin write
CREATE POLICY "Admins can insert godj_backgrounds"
  ON public.godj_backgrounds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can update godj_backgrounds"
  ON public.godj_backgrounds FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete godj_backgrounds"
  ON public.godj_backgrounds FOR DELETE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('godj-backgrounds', 'godj-backgrounds', true);

-- Storage RLS: public read
CREATE POLICY "Public read godj-backgrounds"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'godj-backgrounds');

-- Storage RLS: admin upload
CREATE POLICY "Admin upload godj-backgrounds"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'godj-backgrounds' AND public.has_admin_role(auth.uid()));

-- Storage RLS: admin delete
CREATE POLICY "Admin delete godj-backgrounds"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'godj-backgrounds' AND public.has_admin_role(auth.uid()));

-- Seed the current default video
INSERT INTO public.godj_backgrounds (title, video_url, is_active, playback_rate, overlay_opacity)
VALUES ('Default DJ Background', '/videos/godj-bg.mov', true, 0.8, 60);
