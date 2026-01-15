-- Add RLS policy to allow artists to update their own roster entries (accept/reject invites)
CREATE POLICY "Artists can update their own roster status"
ON public.label_roster
FOR UPDATE
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

-- Add RLS policy to allow labels to insert notifications for artists they invite
CREATE POLICY "Labels can notify roster artists"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.label_roster
    WHERE label_roster.label_id = auth.uid()
    AND label_roster.artist_id = notifications.user_id
  )
);