/*
  # Create Storage Bucket for Media Files

  1. Create a new storage bucket for media files
  2. Set up public access policies
*/

-- Create a new storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Allow public access to media bucket
CREATE POLICY "Allow public access to media bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Allow authenticated users to upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow users to update and delete their own uploads
CREATE POLICY "Allow users to manage their uploads"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid())
WITH CHECK (bucket_id = 'media' AND owner = auth.uid());