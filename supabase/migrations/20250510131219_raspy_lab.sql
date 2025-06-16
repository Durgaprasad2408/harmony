/*
  # Update Playlist Visibility Policies

  1. Changes
    - Drop existing playlist policies
    - Create new policies to:
      - Make featured playlists publicly visible
      - Restrict user playlist visibility to owners only
      - Allow admins to manage all playlists
    
  2. Security
    - Only featured playlists are publicly visible
    - Users can only see and manage their own playlists
    - Admins retain full access to all playlists
*/

-- Drop existing playlist policies
DROP POLICY IF EXISTS "Anyone can view playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Admin can update any playlist" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;
DROP POLICY IF EXISTS "Admin can delete any playlist" ON playlists;

-- Create new playlist policies
CREATE POLICY "Allow viewing featured playlists"
ON playlists FOR SELECT
TO public
USING (is_featured = true);

CREATE POLICY "Allow users to view own playlists"
ON playlists FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.email() = 'hari.2408dt@gmail.com'
);

CREATE POLICY "Allow users to manage own playlists"
ON playlists FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  user_id = auth.uid()
  OR auth.email() = 'hari.2408dt@gmail.com'
);