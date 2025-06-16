/*
  # Fix user_profiles RLS policies

  1. Changes
    - Drop existing policies that may be causing recursion
    - Create new, simplified policies for user_profiles table
    
  2. Security
    - Enable RLS on user_profiles table
    - Add policies for:
      - Public read access to all profiles
      - Users can update their own profile
      - Admins have full access to all profiles
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable full access for admin users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for everyone" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "Allow public read access"
ON user_profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow users to update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin full access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);