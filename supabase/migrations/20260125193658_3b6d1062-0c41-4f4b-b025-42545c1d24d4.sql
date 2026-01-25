-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Collaborators can view collaborative playlists" ON playlists;
DROP POLICY IF EXISTS "Playlist owners can manage collaborators" ON playlist_collaborators;

-- Create security definer function to check playlist ownership
CREATE OR REPLACE FUNCTION public.is_playlist_owner(_playlist_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM playlists
    WHERE id = _playlist_id AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user is an accepted collaborator
CREATE OR REPLACE FUNCTION public.is_playlist_collaborator(_playlist_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM playlist_collaborators
    WHERE playlist_id = _playlist_id 
      AND user_id = _user_id 
      AND accepted_at IS NOT NULL
  )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Collaborators can view collaborative playlists" 
ON playlists FOR SELECT
USING (public.is_playlist_collaborator(id, auth.uid()));

CREATE POLICY "Playlist owners can manage collaborators" 
ON playlist_collaborators FOR ALL
USING (public.is_playlist_owner(playlist_id, auth.uid()));