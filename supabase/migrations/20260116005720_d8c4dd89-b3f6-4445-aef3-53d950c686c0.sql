-- Create function to notify when someone follows a user
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT 
    NEW.following_id,
    'new_follower',
    'New Follower!',
    COALESCE((SELECT display_name FROM public.profiles WHERE id = NEW.follower_id), 'Someone') || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new followers
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Create function to notify when a track is liked
CREATE OR REPLACE FUNCTION public.notify_track_liked()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT 
    t.artist_id,
    'track_liked',
    'Someone liked your track!',
    COALESCE((SELECT display_name FROM public.profiles WHERE id = NEW.user_id), 'Someone') || ' liked "' || t.title || '"',
    jsonb_build_object('track_id', NEW.track_id, 'liker_id', NEW.user_id)
  FROM public.tracks t WHERE t.id = NEW.track_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for track likes
DROP TRIGGER IF EXISTS on_track_liked ON public.likes;
CREATE TRIGGER on_track_liked
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.notify_track_liked();