ALTER TABLE public.track_karaoke 
  ADD COLUMN IF NOT EXISTS stem_separation_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vocals_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS replicate_prediction_id text DEFAULT NULL;