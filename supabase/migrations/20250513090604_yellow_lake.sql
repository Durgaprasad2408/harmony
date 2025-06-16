/*
  # Add Play History Tracking

  1. New Tables
    - `play_history` - Stores track play history for users
    
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create play history table
CREATE TABLE IF NOT EXISTS play_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  track_id uuid NOT NULL REFERENCES tracks,
  played_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_play_history UNIQUE (user_id, track_id, played_at)
);

-- Enable RLS
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert own play history"
ON play_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own play history"
ON play_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_play_history_user_track ON play_history (user_id, track_id);
CREATE INDEX idx_play_history_played_at ON play_history (played_at DESC);