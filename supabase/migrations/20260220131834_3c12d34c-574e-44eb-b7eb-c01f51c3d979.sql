
-- Fix profiles_public view to use security invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
  SELECT id, display_name, display_name_font, avatar_url, banner_image_url, bio, website_url, social_links, is_verified, onboarding_completed, created_at, updated_at
  FROM public.profiles;
