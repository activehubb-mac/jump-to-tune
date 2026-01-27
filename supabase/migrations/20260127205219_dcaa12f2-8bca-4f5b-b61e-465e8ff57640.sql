-- First add the column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name_font text DEFAULT 'Inter';

-- Drop and recreate the profiles_public view with the new column
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public
WITH (security_invoker=on) AS
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