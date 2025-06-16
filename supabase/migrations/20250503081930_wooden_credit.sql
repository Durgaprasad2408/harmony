/*
  # Initialize Music Player Schema

  1. New Tables
    - `user_profiles` - Stores user profile information with roles
    - `tracks` - Stores music track information
    - `playlists` - Stores playlist information
    - `playlist_tracks` - Junction table for tracks in playlists
  
  2. Security
    - Enable RLS on all tables
    - Add policies for each table for appropriate access control
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Tracks Table
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  album text NOT NULL,
  duration integer NOT NULL, -- Duration in seconds
  url text NOT NULL,
  cover_url text,
  uploaded_by uuid NOT NULL REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

-- Junction Table for Tracks in Playlists
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES tracks ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (playlist_id, track_id) -- Prevent duplicate tracks in playlist
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public users can view profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can update any profile"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tracks Policies
CREATE POLICY "Anyone can view tracks"
  ON tracks
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert tracks"
  ON tracks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update tracks"
  ON tracks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete tracks"
  ON tracks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Playlists Policies
CREATE POLICY "Anyone can view playlists"
  ON playlists
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create playlists"
  ON playlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON playlists
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can update any playlist"
  ON playlists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own playlists"
  ON playlists
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can delete any playlist"
  ON playlists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Playlist Tracks Policies
CREATE POLICY "Anyone can view playlist tracks"
  ON playlist_tracks
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage tracks in own playlists"
  ON playlist_tracks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage any playlist tracks"
  ON playlist_tracks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks (title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks (artist);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists (user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks (playlist_id);