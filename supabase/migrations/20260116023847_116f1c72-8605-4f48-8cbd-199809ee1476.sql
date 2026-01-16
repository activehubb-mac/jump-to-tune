-- Create a public view for profiles that excludes sensitive Stripe fields
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
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

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: users can only read their own full profile (including Stripe fields)
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow service role full access for edge functions
CREATE POLICY "Service role can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'service_role');