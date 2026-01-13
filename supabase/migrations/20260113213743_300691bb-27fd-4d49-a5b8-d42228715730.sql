-- =============================================
-- PHASE 1: Update profiles table with new fields
-- =============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banner_image_url text;

-- =============================================
-- PHASE 2: Create tracks table
-- =============================================
CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  genre text,
  price decimal(18, 8) NOT NULL DEFAULT 0,
  total_editions integer NOT NULL DEFAULT 100,
  editions_sold integer NOT NULL DEFAULT 0,
  audio_url text NOT NULL,
  cover_art_url text,
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_draft boolean DEFAULT true,
  has_karaoke boolean DEFAULT false,
  duration integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Tracks RLS policies
CREATE POLICY "Published tracks are viewable by everyone"
ON public.tracks FOR SELECT
USING (is_draft = false);

CREATE POLICY "Artists can view their own tracks"
ON public.tracks FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Labels can view their roster tracks"
ON public.tracks FOR SELECT
USING (auth.uid() = label_id);

CREATE POLICY "Artists can insert their own tracks"
ON public.tracks FOR INSERT
WITH CHECK (
  auth.uid() = artist_id 
  AND public.has_role(auth.uid(), 'artist')
);

CREATE POLICY "Labels can insert tracks for roster artists"
ON public.tracks FOR INSERT
WITH CHECK (
  auth.uid() = label_id 
  AND public.has_role(auth.uid(), 'label')
);

CREATE POLICY "Artists can update their own tracks"
ON public.tracks FOR UPDATE
USING (auth.uid() = artist_id);

CREATE POLICY "Labels can update their tracks"
ON public.tracks FOR UPDATE
USING (auth.uid() = label_id);

CREATE POLICY "Artists can delete their own tracks"
ON public.tracks FOR DELETE
USING (auth.uid() = artist_id);

CREATE POLICY "Labels can delete their tracks"
ON public.tracks FOR DELETE
USING (auth.uid() = label_id);

-- Trigger for updated_at
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 3: Create track_karaoke table
-- =============================================
CREATE TABLE public.track_karaoke (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL UNIQUE REFERENCES public.tracks(id) ON DELETE CASCADE,
  instrumental_url text NOT NULL,
  lyrics text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.track_karaoke ENABLE ROW LEVEL SECURITY;

-- Karaoke RLS policies (follows parent track visibility)
CREATE POLICY "Karaoke viewable for published tracks"
ON public.track_karaoke FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_karaoke.track_id 
    AND tracks.is_draft = false
  )
);

CREATE POLICY "Track owners can manage karaoke"
ON public.track_karaoke FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_karaoke.track_id 
    AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid())
  )
);

-- =============================================
-- PHASE 4: Create purchases table
-- =============================================
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  edition_number integer NOT NULL,
  price_paid decimal(18, 8) NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(track_id, edition_number)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Purchases RLS policies
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Artists can view purchases of their tracks"
ON public.purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = purchases.track_id 
    AND (tracks.artist_id = auth.uid() OR tracks.label_id = auth.uid())
  )
);

CREATE POLICY "Authenticated users can purchase"
ON public.purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PHASE 5: Create follows table
-- =============================================
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows RLS policies
CREATE POLICY "Follows are viewable by everyone"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- =============================================
-- PHASE 6: Create likes table
-- =============================================
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Likes RLS policies
CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT
USING (true);

CREATE POLICY "Users can like tracks"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- PHASE 7: Create label_roster table
-- =============================================
CREATE TABLE public.label_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(label_id, artist_id)
);

ALTER TABLE public.label_roster ENABLE ROW LEVEL SECURITY;

-- Label roster RLS policies
CREATE POLICY "Roster is viewable by everyone"
ON public.label_roster FOR SELECT
USING (true);

CREATE POLICY "Labels can add artists to roster"
ON public.label_roster FOR INSERT
WITH CHECK (
  auth.uid() = label_id 
  AND public.has_role(auth.uid(), 'label')
);

CREATE POLICY "Labels can update roster status"
ON public.label_roster FOR UPDATE
USING (auth.uid() = label_id);

CREATE POLICY "Labels can remove from roster"
ON public.label_roster FOR DELETE
USING (auth.uid() = label_id);

-- =============================================
-- PHASE 8: Create profile_genres table
-- =============================================
CREATE TABLE public.profile_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre text NOT NULL,
  UNIQUE(profile_id, genre)
);

ALTER TABLE public.profile_genres ENABLE ROW LEVEL SECURITY;

-- Create function to limit genres per profile
CREATE OR REPLACE FUNCTION public.check_max_genres()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_genres WHERE profile_id = NEW.profile_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 genres allowed per profile';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_genres
BEFORE INSERT ON public.profile_genres
FOR EACH ROW
EXECUTE FUNCTION public.check_max_genres();

-- Profile genres RLS policies
CREATE POLICY "Genres are viewable by everyone"
ON public.profile_genres FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own genres"
ON public.profile_genres FOR ALL
USING (auth.uid() = profile_id);

-- =============================================
-- PHASE 9: Create storage buckets
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tracks', 'tracks', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('instrumentals', 'instrumentals', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tracks bucket (private)
CREATE POLICY "Artists and labels can upload tracks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks' 
  AND (public.has_role(auth.uid(), 'artist') OR public.has_role(auth.uid(), 'label'))
);

CREATE POLICY "Track owners can access their audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Track owners can delete their audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for covers bucket (public)
CREATE POLICY "Cover art is publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Artists and labels can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND (public.has_role(auth.uid(), 'artist') OR public.has_role(auth.uid(), 'label'))
);

CREATE POLICY "Cover owners can delete covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for instrumentals bucket (private)
CREATE POLICY "Artists and labels can upload instrumentals"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instrumentals' 
  AND (public.has_role(auth.uid(), 'artist') OR public.has_role(auth.uid(), 'label'))
);

CREATE POLICY "Instrumental owners can access their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instrumentals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instrumental owners can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instrumentals' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for banners bucket (public)
CREATE POLICY "Banners are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Users can upload their own banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- PHASE 10: Create indexes for performance
-- =============================================
CREATE INDEX idx_tracks_artist_id ON public.tracks(artist_id);
CREATE INDEX idx_tracks_label_id ON public.tracks(label_id);
CREATE INDEX idx_tracks_genre ON public.tracks(genre);
CREATE INDEX idx_tracks_is_draft ON public.tracks(is_draft);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_track_id ON public.purchases(track_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_track_id ON public.likes(track_id);
CREATE INDEX idx_label_roster_label_id ON public.label_roster(label_id);
CREATE INDEX idx_label_roster_artist_id ON public.label_roster(artist_id);
CREATE INDEX idx_profile_genres_profile_id ON public.profile_genres(profile_id);