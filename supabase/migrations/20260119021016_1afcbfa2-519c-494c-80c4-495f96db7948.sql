-- Create albums table for grouping tracks into releases
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  label_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  cover_art_url TEXT,
  release_type TEXT NOT NULL CHECK (release_type IN ('single', 'ep', 'album')),
  genre TEXT,
  is_draft BOOLEAN NOT NULL DEFAULT true,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album relationship columns to tracks table
ALTER TABLE public.tracks 
ADD COLUMN album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
ADD COLUMN track_number INTEGER;

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums
CREATE POLICY "Published albums are viewable by everyone"
ON public.albums FOR SELECT
USING (is_draft = false);

CREATE POLICY "Artists can view their own albums"
ON public.albums FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert their own albums"
ON public.albums FOR INSERT
WITH CHECK (auth.uid() = artist_id AND has_role(auth.uid(), 'artist'::app_role));

CREATE POLICY "Artists can update their own albums"
ON public.albums FOR UPDATE
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete their own albums"
ON public.albums FOR DELETE
USING (auth.uid() = artist_id);

CREATE POLICY "Labels can view their albums"
ON public.albums FOR SELECT
USING (auth.uid() = label_id);

CREATE POLICY "Labels can insert albums for roster artists"
ON public.albums FOR INSERT
WITH CHECK (auth.uid() = label_id AND has_role(auth.uid(), 'label'::app_role));

CREATE POLICY "Labels can update their albums"
ON public.albums FOR UPDATE
USING (auth.uid() = label_id);

CREATE POLICY "Labels can delete their albums"
ON public.albums FOR DELETE
USING (auth.uid() = label_id);

-- Add updated_at trigger for albums
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster album lookups
CREATE INDEX idx_tracks_album_id ON public.tracks(album_id);
CREATE INDEX idx_albums_artist_id ON public.albums(artist_id);
CREATE INDEX idx_albums_label_id ON public.albums(label_id);