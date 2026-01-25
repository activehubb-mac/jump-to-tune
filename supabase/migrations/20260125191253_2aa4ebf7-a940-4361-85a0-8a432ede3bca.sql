-- Create playlist_folders table for organizing playlists
CREATE TABLE public.playlist_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to playlists table
ALTER TABLE public.playlists 
ADD COLUMN folder_id UUID REFERENCES public.playlist_folders(id) ON DELETE SET NULL;

-- Create playlist_collaborators table for shared playlists
CREATE TABLE public.playlist_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(playlist_id, user_id)
);

-- Add is_collaborative flag to playlists
ALTER TABLE public.playlists
ADD COLUMN is_collaborative BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.playlist_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlist_folders
CREATE POLICY "Users can create their own folders"
ON public.playlist_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders"
ON public.playlist_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.playlist_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.playlist_folders FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for playlist_collaborators
CREATE POLICY "Playlist owners can manage collaborators"
ON public.playlist_collaborators FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_collaborators.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can view collaborations they're part of"
ON public.playlist_collaborators FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can accept/update their own collaboration"
ON public.playlist_collaborators FOR UPDATE
USING (auth.uid() = user_id);

-- Update playlist_tracks RLS to allow collaborators to add tracks
CREATE POLICY "Collaborators can add tracks to collaborative playlists"
ON public.playlist_tracks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlist_collaborators pc
  JOIN public.playlists p ON p.id = pc.playlist_id
  WHERE pc.playlist_id = playlist_tracks.playlist_id
  AND pc.user_id = auth.uid()
  AND pc.accepted_at IS NOT NULL
  AND pc.role = 'editor'
  AND p.is_collaborative = true
));

CREATE POLICY "Collaborators can remove tracks from collaborative playlists"
ON public.playlist_tracks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.playlist_collaborators pc
  JOIN public.playlists p ON p.id = pc.playlist_id
  WHERE pc.playlist_id = playlist_tracks.playlist_id
  AND pc.user_id = auth.uid()
  AND pc.accepted_at IS NOT NULL
  AND pc.role = 'editor'
  AND p.is_collaborative = true
));

-- Update playlists RLS to allow collaborators to view
CREATE POLICY "Collaborators can view collaborative playlists"
ON public.playlists FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.playlist_collaborators
  WHERE playlist_collaborators.playlist_id = playlists.id
  AND playlist_collaborators.user_id = auth.uid()
  AND playlist_collaborators.accepted_at IS NOT NULL
));

-- Trigger for updated_at on folders
CREATE TRIGGER update_playlist_folders_updated_at
BEFORE UPDATE ON public.playlist_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();