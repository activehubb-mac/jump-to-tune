-- Make tracks bucket public for streaming
UPDATE storage.buckets 
SET public = true 
WHERE id = 'tracks';

-- Add public SELECT policy for tracks bucket
CREATE POLICY "Published tracks audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tracks');