
CREATE TABLE public.identity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES public.artist_identities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT NOT NULL,
  edit_mode TEXT NOT NULL CHECK (edit_mode IN ('quick', 'style', 'full', 'original')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.identity_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own versions" ON public.identity_versions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_identity_versions_identity ON public.identity_versions(identity_id);
CREATE INDEX idx_identity_versions_user ON public.identity_versions(user_id);
