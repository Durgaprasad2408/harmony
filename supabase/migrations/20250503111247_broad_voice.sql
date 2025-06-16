/*
  # Add Albums Table and Relations

  1. New Tables
    - `albums` - Stores album information
  
  2. Changes
    - Add album_id to tracks table
    - Update tracks table constraints
    
  3. Security
    - Enable RLS on albums table
    - Add policies for appropriate access control
*/

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES auth.users
);

-- Add album_id to tracks
ALTER TABLE tracks
ADD COLUMN album_id uuid REFERENCES albums(id);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to albums"
ON albums FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin to manage albums"
ON albums FOR ALL 
TO authenticated
USING (
  auth.email() = 'hari.2408dt@gmail.com'
)
WITH CHECK (
  auth.email() = 'hari.2408dt@gmail.com'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums (title);
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums (artist);