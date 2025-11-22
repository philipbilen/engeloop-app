-- Migration: Allow 0% Licensor Shares (Flat Fees)
-- Description: Updates the share_percent constraint to allow 0% for flat fee scenarios
--              Requires notes to be documented when share_percent = 0 (enforced in app layer)
-- Created: 2025-11-16

-- Drop existing constraint that requires share_percent > 0
ALTER TABLE licensor_shares
DROP CONSTRAINT IF EXISTS licensor_shares_share_percent_check;

-- Add new constraint allowing 0% (for flat fees)
ALTER TABLE licensor_shares
ADD CONSTRAINT licensor_shares_share_percent_check
CHECK (share_percent >= 0 AND share_percent <= 100);

-- Add comment explaining 0% shares usage
COMMENT ON COLUMN licensor_shares.share_percent IS
'Percentage of the licensor pool (NOT direct % of NetToCompany).
Can be 0% for flat fee scenarios - in this case, notes field MUST document the flat fee arrangement.
Final % of NetToCompany = (share_percent × contract.licensor_pool_percent) / 100';

-- Add comment to notes column explaining flat fee requirement
COMMENT ON COLUMN licensor_shares.notes IS
'Optional notes about this licensor share.
REQUIRED when share_percent = 0 to document flat fee arrangements.
Examples: "Flat fee paid on signing", "Producer received $5000 upfront", "Includes assignment to [name]"';
