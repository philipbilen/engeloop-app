-- Migration: Track Shares Validation Function
-- Description: Creates function to validate licensor shares for a single track
--              Returns pool sum, final NTC sum, and validation status
-- Created: 2025-11-16

CREATE OR REPLACE FUNCTION validate_track_shares(p_track_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  pool_sum DECIMAL(5,2),
  final_ntc_sum DECIMAL(5,2),
  licensor_pool_percent DECIMAL(5,2),
  has_flat_fees BOOLEAN
) AS $$
DECLARE
  v_pool_sum DECIMAL(5,2);
  v_licensor_pool DECIMAL(5,2);
  v_has_flat_fees BOOLEAN;
  v_final_ntc DECIMAL(5,2);
BEGIN
  -- Get contract's licensor pool percentage for this track
  SELECT c.licensor_pool_percent
  INTO v_licensor_pool
  FROM tracks t
  JOIN releases r ON r.id = t.release_id
  JOIN contract_releases cr ON cr.release_id = r.id
  JOIN contracts c ON c.id = cr.contract_id
  WHERE t.id = p_track_id
  LIMIT 1;

  -- If no contract found, default to 50%
  v_licensor_pool := COALESCE(v_licensor_pool, 50.00);

  -- Sum all pool shares for this track
  SELECT COALESCE(SUM(ls.share_percent), 0)
  INTO v_pool_sum
  FROM licensor_shares ls
  WHERE ls.track_id = p_track_id;

  -- Calculate final NTC percentage
  v_final_ntc := (v_pool_sum * v_licensor_pool) / 100;

  -- Check for flat fees (0% shares with notes)
  SELECT EXISTS(
    SELECT 1 FROM licensor_shares
    WHERE track_id = p_track_id
    AND share_percent = 0
    AND notes IS NOT NULL
    AND notes != ''
  ) INTO v_has_flat_fees;

  -- Validation logic:
  -- Valid if pool_sum = 100%
  -- Warning (still valid) if pool_sum < 100% AND has documented flat fees
  -- Invalid if pool_sum > 100% OR (pool_sum < 100% AND no flat fees)
  RETURN QUERY SELECT
    (v_pool_sum = 100 OR (v_pool_sum < 100 AND v_has_flat_fees)) AS is_valid,
    v_pool_sum AS pool_sum,
    v_final_ntc AS final_ntc_sum,
    v_licensor_pool AS licensor_pool_percent,
    v_has_flat_fees AS has_flat_fees;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining function usage
COMMENT ON FUNCTION validate_track_shares IS
'Validates licensor shares for a single track.
Returns validation status, pool share sum, final NTC sum, and flat fee indicator.
Validation rules:
- VALID: pool shares sum to 100%
- WARNING (valid): pool shares < 100% with documented flat fees (share_percent=0 with notes)
- INVALID: pool shares > 100% OR pool shares < 100% without flat fee documentation';
