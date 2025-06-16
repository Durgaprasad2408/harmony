-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON user_profiles;
DROP POLICY IF EXISTS "Allow user management" ON user_profiles;

-- Create simplified policies
CREATE POLICY "Allow public read access"
ON user_profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow user management"
ON user_profiles FOR ALL 
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.email() = 'hari.2408dt@gmail.com'
);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies
CREATE POLICY "Allow public read access to media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Allow authenticated users to manage media"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');