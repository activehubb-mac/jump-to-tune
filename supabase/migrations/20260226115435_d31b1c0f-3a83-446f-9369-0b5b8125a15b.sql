
-- Add session_type column to dj_sessions
ALTER TABLE public.dj_sessions 
ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'jumtunes';

-- Create dj_session_spotify table for Spotify embed data
CREATE TABLE IF NOT EXISTS public.dj_session_spotify (
  session_id uuid PRIMARY KEY REFERENCES public.dj_sessions(id) ON DELETE CASCADE,
  spotify_url_raw text NOT NULL,
  spotify_embed_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dj_session_spotify ENABLE ROW LEVEL SECURITY;

-- Public can read spotify session data
CREATE POLICY "Public can view spotify session data"
ON public.dj_session_spotify
FOR SELECT
USING (true);

-- Session owners can manage spotify data
CREATE POLICY "Session owners can manage spotify data"
ON public.dj_session_spotify
FOR ALL
USING (EXISTS (
  SELECT 1 FROM dj_sessions
  WHERE dj_sessions.id = dj_session_spotify.session_id
  AND dj_sessions.artist_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM dj_sessions
  WHERE dj_sessions.id = dj_session_spotify.session_id
  AND dj_sessions.artist_id = auth.uid()
));

-- Service role can manage
CREATE POLICY "Service role can manage spotify data"
ON public.dj_session_spotify
FOR ALL
USING (auth.role() = 'service_role'::text);
