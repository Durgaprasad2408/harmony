/*
  # Fix user_profiles policies

  1. Changes
    - Drop existing policies causing infinite recursion
    - Create new, simplified policies for user_profiles table
    
  2. Security
    - Enable RLS on user_profiles table
    - Add policies for:
      - Public can read all profiles
      - Users can update their own profile
      - Admins have full access
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow admin full access" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for everyone" 
ON user_profiles FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
ON user_profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Add admin override policy
CREATE POLICY "Enable full access for admin users" 
ON user_profiles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);