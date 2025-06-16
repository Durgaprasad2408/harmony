/*
  # Add Favorites Support

  1. New Tables
    - `favorites` - Stores user's favorite tracks
    
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  track_id uuid NOT NULL REFERENCES tracks,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_favorite UNIQUE (user_id, track_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own favorites"
ON favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_favorites_user_track ON favorites (user_id, track_id);
CREATE INDEX idx_favorites_created_at ON favorites (created_at DESC);