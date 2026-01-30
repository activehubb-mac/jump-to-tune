-- Drop the existing view with security_invoker
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate without security_invoker (uses DEFINER by default)
-- This allows all users to read public profile data through the view
CREATE VIEW public.profiles_public AS
SELECT 
    id,
    display_name,
    display_name_font,
    avatar_url,
    banner_image_url,
    bio,
    website_url,
    is_verified,
    onboarding_completed,
    created_at,
    updated_at
FROM profiles;

-- Grant SELECT to all authenticated users and anonymous users
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;