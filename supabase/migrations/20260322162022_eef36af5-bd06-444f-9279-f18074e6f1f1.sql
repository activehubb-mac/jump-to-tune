ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS default_identity_id UUID REFERENCES public.artist_identities(id) ON DELETE SET NULL;