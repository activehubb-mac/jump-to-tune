-- Add preview_duration column to tracks table (in seconds, default 30)
ALTER TABLE public.tracks 
ADD COLUMN preview_duration integer NOT NULL DEFAULT 30;