-- Drop the existing security_invoker view and recreate as security definer
-- This allows public reads of safe fields while Stripe details remain hidden

DROP VIEW IF EXISTS public.profiles_public;

-- Recreate view WITHOUT security_invoker (defaults to security definer)
-- This bypasses RLS on the profiles table but only exposes safe columns
CREATE VIEW public.profiles_public AS
  SELECT 
    id,
    display_name,
    avatar_url,
    banner_image_url,
    bio,
    website_url,
    is_verified,
    onboarding_completed,
    created_at,
    updated_at
  FROM public.profiles;

-- Grant access to the view for all roles
GRANT SELECT ON public.profiles_public TO anon, authenticated;