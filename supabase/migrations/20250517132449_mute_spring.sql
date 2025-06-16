/*
  # Add Artists Management Support

  1. New Tables
    - `artists` - Stores artist information
  
  2. Security
    - Enable RLS
    - Add policies for admin management
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to artists"
ON artists FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin to manage artists"
ON artists FOR ALL 
TO authenticated
USING (
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.email() = 'hari.2408dt@gmail.com'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists (name);