-- Drop existing policies
DROP POLICY IF EXISTS "Admin can delete tracks" ON tracks;
DROP POLICY IF EXISTS "Admin can insert tracks" ON tracks;
DROP POLICY IF EXISTS "Admin can update tracks" ON tracks;
DROP POLICY IF EXISTS "Anyone can view tracks" ON tracks;

-- Create new track policies
CREATE POLICY "Allow public read access to tracks"
ON tracks FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin to manage tracks"
ON tracks FOR ALL 
TO authenticated
USING (
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.email() = 'hari.2408dt@gmail.com'
);

-- Ensure storage policies are correct
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage media" ON storage.objects;

CREATE POLICY "Allow public read access to media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Allow admin to manage media"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  bucket_id = 'media' AND
  auth.email() = 'hari.2408dt@gmail.com'
);