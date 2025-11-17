-- Migration: Contract Pool Split Schema Update
-- Description: Adds label_share_percent and licensor_pool_percent columns to contracts table
--              This implements the two-level share structure (label vs licensor pool)
-- Created: 2025-11-16

-- Add label and licensor pool percentage columns
ALTER TABLE contracts
ADD COLUMN label_share_percent DECIMAL(5,2) NOT NULL DEFAULT 50.00,
ADD COLUMN licensor_pool_percent DECIMAL(5,2) NOT NULL DEFAULT 50.00;

-- Add constraint to ensure they sum to 100%
ALTER TABLE contracts
ADD CONSTRAINT contracts_shares_sum_check
  CHECK (label_share_percent + licensor_pool_percent = 100);

-- Add comments explaining the columns
COMMENT ON COLUMN contracts.label_share_percent IS
'Label''s percentage of NetToCompany (e.g., 50%). Must sum with licensor_pool_percent to 100%.';

COMMENT ON COLUMN contracts.licensor_pool_percent IS
'Total pool allocated to licensors as % of NetToCompany (e.g., 50%).
Individual licensor_shares.share_percent values represent shares of THIS pool, not of NetToCompany directly.
Final % of NetToCompany = (licensor_shares.share_percent × licensor_pool_percent) / 100';

-- Example calculation comment
COMMENT ON CONSTRAINT contracts_shares_sum_check ON contracts IS
'Ensures label share + licensor pool = 100%.
Example: Label 50% + Licensor Pool 50% = 100%
Then if a licensor has 40% of pool: Final NTC = 0.40 × 50% = 20%';
