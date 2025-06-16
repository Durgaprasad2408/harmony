/*
  # Add metadata fields to tracks table

  1. Changes
    - Add genre field
    - Add mood field
    - Add release_year field
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add new columns to tracks table
ALTER TABLE tracks
ADD COLUMN genre text,
ADD COLUMN mood text,
ADD COLUMN release_year integer;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks (genre);
CREATE INDEX IF NOT EXISTS idx_tracks_mood ON tracks (mood);
CREATE INDEX IF NOT EXISTS idx_tracks_release_year ON tracks (release_year);