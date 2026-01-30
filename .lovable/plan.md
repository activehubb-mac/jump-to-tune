
# Fix "Unknown Artist" Issue - Root Cause and Solution

## Problem Summary
Regular users see "Unknown Artist" on track cards while admins can see all artist names correctly. This is a data access issue, not a display bug.

## Root Cause Analysis
The application uses a `profiles_public` view to safely expose profile data without sensitive Stripe fields. However, this view was created with `security_invoker=on`, which means:

- The view runs with the **caller's permissions** (not the view owner's)
- The underlying `profiles` table has RLS policies that only allow users to see **their own profile**
- Result: Regular users can't access other artists' profile data through the view

**Current RLS on `profiles` table:**
- Users can view their own profile only (`auth.uid() = id`)
- Admins can view all profiles
- Service role can view all profiles

**Why admins see everything:** Admin users have a policy that grants full SELECT access to the profiles table.

## Solution
Recreate the `profiles_public` view **without** `security_invoker=on`. This will make it run with DEFINER privileges (view owner's permissions), allowing all users to read public profile data while keeping sensitive Stripe fields hidden.

## Implementation Steps

### Step 1: Drop and recreate the profiles_public view
Create a SQL migration that:
1. Drops the existing `profiles_public` view
2. Recreates it **without** `security_invoker=on`

```sql
-- Drop the existing view
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate without security_invoker (uses DEFINER by default)
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

-- Grant SELECT to all authenticated users and anon
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
```

### Step 2: No code changes required
The hooks (`useNewReleases`, `useTrendingTracks`, `useArtists`, etc.) already query `profiles_public` correctly. Once the view permissions are fixed, artist names will display properly for all users.

## Why This Is Secure
- The view only exposes non-sensitive columns (no Stripe data)
- Without `security_invoker`, the view runs as the owner (typically `postgres` or `supabase_admin`)
- The owner has permission to read from `profiles`, so the view can access the data
- Regular users still cannot access the `profiles` table directly - only through the sanitized view

## Technical Details

**Affected hooks that fetch from profiles_public:**
- `useNewReleases` - New releases section
- `useTrendingTracks` - Trending tracks carousel  
- `useArtists` - Artists listing page
- `useBrowseSearch` - Search results
- `useFeaturedContent` - Featured artists/tracks
- `useArtistProfile` - Artist profile pages
- `useLabelRoster` - Label roster display
- `useUserProfile` - User profile pages
- `useFollowerCounts` - Follower statistics
- `useFeaturedOnTracks` - Featured collaborations

All these will automatically work correctly once the view is fixed - no code changes needed.
