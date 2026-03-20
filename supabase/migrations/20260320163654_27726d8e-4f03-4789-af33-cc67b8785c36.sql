
-- Create ai-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-videos', 'ai-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own videos
CREATE POLICY "Users can read own ai-videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ai-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow service role uploads (edge function uses service role)
CREATE POLICY "Service role can insert ai-videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-videos');

-- Public read for completed videos (bucket is public)
CREATE POLICY "Public can read ai-videos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'ai-videos');
