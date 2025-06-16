/*
  # Add Genre and Mood Management Support

  1. New Tables
    - `genres` - Stores genre information
    - `moods` - Stores mood information
  
  2. Changes
    - Add foreign key constraints to tracks table
    - Add indexes for better performance
    
  3. Security
    - Enable RLS on new tables
    - Add policies for admin management
*/

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create moods table
CREATE TABLE IF NOT EXISTS moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints to tracks
ALTER TABLE tracks
DROP COLUMN genre,
DROP COLUMN mood,
ADD COLUMN genre_id uuid REFERENCES genres(id),
ADD COLUMN mood_id uuid REFERENCES moods(id);

-- Enable RLS
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Create policies for genres
CREATE POLICY "Allow public read access to genres"
ON genres FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin to manage genres"
ON genres FOR ALL 
TO authenticated
USING (
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.email() = 'hari.2408dt@gmail.com'
);

-- Create policies for moods
CREATE POLICY "Allow public read access to moods"
ON moods FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin to manage moods"
ON moods FOR ALL 
TO authenticated
USING (
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.email() = 'hari.2408dt@gmail.com'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracks_genre_id ON tracks (genre_id);
CREATE INDEX IF NOT EXISTS idx_tracks_mood_id ON tracks (mood_id);
CREATE INDEX IF NOT EXISTS idx_genres_name ON genres (name);
CREATE INDEX IF NOT EXISTS idx_moods_name ON moods (name);