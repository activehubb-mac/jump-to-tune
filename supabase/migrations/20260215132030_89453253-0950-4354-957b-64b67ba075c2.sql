
-- Create a sequence for recording IDs
CREATE SEQUENCE IF NOT EXISTS public.recording_id_seq START WITH 1 INCREMENT BY 1;

-- Function to generate recording ID in format JT-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION public.generate_recording_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val bigint;
BEGIN
  seq_val := nextval('recording_id_seq');
  RETURN 'JT-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(seq_val::text, 6, '0');
END;
$$;

-- Create track_registrations table
CREATE TABLE public.track_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  recording_id text NOT NULL UNIQUE DEFAULT public.generate_recording_id(),
  audio_hash text NOT NULL,
  uploaded_by uuid NOT NULL,
  upload_timestamp timestamptz NOT NULL DEFAULT now(),
  country text,
  rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on track_id for fast lookups
CREATE INDEX idx_track_registrations_track_id ON public.track_registrations(track_id);
CREATE INDEX idx_track_registrations_uploaded_by ON public.track_registrations(uploaded_by);
CREATE INDEX idx_track_registrations_recording_id ON public.track_registrations(recording_id);

-- Enable RLS
ALTER TABLE public.track_registrations ENABLE ROW LEVEL SECURITY;

-- Artists can view registrations for their own tracks
CREATE POLICY "Artists can view their track registrations"
ON public.track_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_registrations.track_id
    AND tracks.artist_id = auth.uid()
  )
);

-- Labels can view registrations for their tracks
CREATE POLICY "Labels can view their track registrations"
ON public.track_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_registrations.track_id
    AND tracks.label_id = auth.uid()
  )
);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.track_registrations
FOR SELECT
USING (has_admin_role(auth.uid()));

-- Public can view recording_id for published tracks
CREATE POLICY "Public can view published track registrations"
ON public.track_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = track_registrations.track_id
    AND tracks.is_draft = false
  )
);

-- Track owners can insert registrations
CREATE POLICY "Track owners can insert registrations"
ON public.track_registrations
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Service role can manage all registrations
CREATE POLICY "Service role can manage registrations"
ON public.track_registrations
FOR ALL
USING (auth.role() = 'service_role'::text);
