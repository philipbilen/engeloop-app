-- Add position column to tracks table for ordering
ALTER TABLE tracks
ADD COLUMN position INT NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_tracks_release_position ON tracks(release_id, position);

-- Update existing tracks to have sequential positions
WITH ordered_tracks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY release_id ORDER BY created_at) - 1 AS new_position
  FROM tracks
)
UPDATE tracks
SET position = ordered_tracks.new_position
FROM ordered_tracks
WHERE tracks.id = ordered_tracks.id;
