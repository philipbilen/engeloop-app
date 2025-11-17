-- Migration: Release Shares Validation Function
-- Description: Creates function to validate licensor shares for all tracks in a release
--              Returns validation status and list of invalid tracks
-- Created: 2025-11-16

CREATE OR REPLACE FUNCTION validate_release_shares(p_release_id UUID)
RETURNS TABLE(
  all_valid BOOLEAN,
  invalid_tracks JSONB
) AS $$
DECLARE
  v_invalid_tracks JSONB;
BEGIN
  -- Find tracks with invalid shares
  -- Invalid if:
  --   - Pool sum > 100%, OR
  --   - Pool sum < 100% without documented flat fees, OR
  --   - Pool sum != 100% (and no flat fees)
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'track_id', t.id,
      'title', t.title,
      'pool_sum', COALESCE(SUM(ls.share_percent), 0),
      'has_flat_fees', EXISTS(
        SELECT 1 FROM licensor_shares ls2
        WHERE ls2.track_id = t.id
        AND ls2.share_percent = 0
        AND ls2.notes IS NOT NULL
        AND ls2.notes != ''
      )
    )
  )
  INTO v_invalid_tracks
  FROM tracks t
  LEFT JOIN licensor_shares ls ON ls.track_id = t.id
  WHERE t.release_id = p_release_id
  GROUP BY t.id, t.title
  HAVING (
    -- Invalid if sum > 100%
    COALESCE(SUM(ls.share_percent), 0) > 100
    OR (
      -- Invalid if sum != 100% AND no flat fees documented
      COALESCE(SUM(ls.share_percent), 0) != 100
      AND NOT EXISTS(
        SELECT 1 FROM licensor_shares ls2
        WHERE ls2.track_id = t.id
        AND ls2.share_percent = 0
        AND ls2.notes IS NOT NULL
        AND ls2.notes != ''
      )
    )
  );

  -- Return results
  RETURN QUERY SELECT
    (v_invalid_tracks IS NULL) AS all_valid,
    COALESCE(v_invalid_tracks, '[]'::JSONB) AS invalid_tracks;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining function usage
COMMENT ON FUNCTION validate_release_shares IS
'Validates licensor shares for all tracks in a release.
Returns whether all tracks are valid and a JSON array of invalid tracks.
Used to block status progression to "delivered" or "released" if shares are incomplete.

Invalid tracks are those where:
1. Pool shares sum > 100%, OR
2. Pool shares sum < 100% without documented flat fees (0% shares with notes), OR
3. Pool shares sum != 100% (exact)

Warning state (valid but < 100%): Pool shares < 100% WITH documented flat fees is allowed.';
