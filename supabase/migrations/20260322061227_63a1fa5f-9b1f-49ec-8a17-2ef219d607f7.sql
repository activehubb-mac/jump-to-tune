CREATE TABLE public.artist_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url text,
  reference_photo_url text,
  name_suggestions text[],
  bio text,
  visual_theme text,
  tagline text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.artist_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own identities"
  ON public.artist_identities FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());