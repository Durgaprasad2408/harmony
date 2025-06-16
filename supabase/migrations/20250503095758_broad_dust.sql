-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete access for own profile" ON user_profiles;

-- Create simplified policies without recursion
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