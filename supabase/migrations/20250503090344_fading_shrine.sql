/*
  # Fix user_profiles RLS policies

  1. Changes
    - Drop existing RLS policies for user_profiles table
    - Add new policies that properly handle:
      - Profile creation during registration
      - Profile updates by owners
      - Admin access
      - Public read access
  
  2. Security
    - Ensures users can only create their own profile
    - Maintains existing admin capabilities
    - Preserves public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON user_profiles;

-- Create new policies with proper security rules
CREATE POLICY "Enable read access for everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable full access for admin users" ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );