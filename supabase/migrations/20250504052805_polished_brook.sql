/*
  # Add Featured Playlists Support

  1. Changes
    - Add is_featured column to playlists table
    - Add featured_order column for ordering featured playlists
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add new columns to playlists table
ALTER TABLE playlists
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN featured_order integer;

-- Create index for featured playlists
CREATE INDEX idx_playlists_featured ON playlists (is_featured, featured_order);