CREATE POLICY "Users can delete own video jobs"
  ON public.ai_video_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own video jobs"
  ON public.ai_video_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());