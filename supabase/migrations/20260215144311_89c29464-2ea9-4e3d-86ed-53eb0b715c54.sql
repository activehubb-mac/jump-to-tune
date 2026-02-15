
-- Recreate profiles_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  display_name,
  display_name_font,
  avatar_url,
  banner_image_url,
  bio,
  website_url,
  created_at,
  updated_at,
  onboarding_completed,
  is_verified
FROM public.profiles;
