/*
  # Fix User Profiles RLS Policy

  1. Changes
    - Add policy to allow new users to create their own profile
    - Keep existing policies intact
  
  2. Security
    - Users can only create their own profile
    - Maintains existing RLS restrictions
*/

-- Add policy to allow users to create their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);