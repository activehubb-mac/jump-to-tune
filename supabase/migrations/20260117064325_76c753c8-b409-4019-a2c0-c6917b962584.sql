-- Create track_credits table for optional music credits
CREATE TABLE public.track_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('writer', 'composer', 'producer', 'engineer')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_track_credits_track_id ON public.track_credits(track_id);
ALTER TABLE public.track_credits ENABLE ROW LEVEL SECURITY;

-- Public can view credits for published tracks
CREATE POLICY "Public can view track credits" ON public.track_credits 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_credits.track_id AND tracks.is_draft = false)
  );

-- Track owners can view their own track credits (including drafts)
CREATE POLICY "Track owners can view credits" ON public.track_credits 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_credits.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Track owners can insert credits
CREATE POLICY "Track owners can insert credits" ON public.track_credits 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_credits.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Track owners can delete credits
CREATE POLICY "Track owners can delete credits" ON public.track_credits 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_credits.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Create track_features table for featuring other artists
CREATE TABLE public.track_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(track_id, artist_id)
);

CREATE INDEX idx_track_features_track_id ON public.track_features(track_id);
CREATE INDEX idx_track_features_artist_id ON public.track_features(artist_id);
ALTER TABLE public.track_features ENABLE ROW LEVEL SECURITY;

-- Public can view features for published tracks
CREATE POLICY "Public can view track features" ON public.track_features 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_features.track_id AND tracks.is_draft = false)
  );

-- Track owners can view their own track features (including drafts)
CREATE POLICY "Track owners can view features" ON public.track_features 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_features.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Track owners can insert features
CREATE POLICY "Track owners can insert features" ON public.track_features 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_features.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Track owners can delete features
CREATE POLICY "Track owners can delete features" ON public.track_features 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_features.track_id 
      AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid()))
  );

-- Add new columns to tracks table
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS moods TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS display_label_name TEXT;