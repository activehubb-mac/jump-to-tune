-- Avatar promotions table
CREATE TABLE public.avatar_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  promotion_type text NOT NULL DEFAULT 'floating' CHECK (promotion_type IN ('floating', 'stage_performer', 'global_background')),
  animation_type text NOT NULL DEFAULT 'perform' CHECK (animation_type IN ('perform', 'walk', 'dj_mix', 'dance')),
  exposure_zone text NOT NULL DEFAULT 'global' CHECK (exposure_zone IN ('home', 'discovery', 'trending', 'global')),
  is_active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.avatar_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage avatar promotions"
  ON public.avatar_promotions FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

CREATE POLICY "Anyone can read active promotions"
  ON public.avatar_promotions FOR SELECT TO anon, authenticated
  USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE TRIGGER update_avatar_promotions_updated_at
  BEFORE UPDATE ON public.avatar_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();