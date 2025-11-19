-- Migration: Share Role Context ENUM Updates
-- Description: Adds missing role context values based on real-world contracts
-- Created: 2025-11-16

-- Add Featured Artist role
ALTER TYPE share_role_context ADD VALUE IF NOT EXISTS 'Featured Artist';

-- Add Sample Clearance role
ALTER TYPE share_role_context ADD VALUE IF NOT EXISTS 'Sample Clearance';

-- Add Remix Rights role
ALTER TYPE share_role_context ADD VALUE IF NOT EXISTS 'Remix Rights';

-- Add comment explaining role context usage
COMMENT ON TYPE share_role_context IS
'Defines the role/reason for a licensor''s share allocation.
Used in licensor_shares table to document why each contact receives their percentage.
Examples from real contracts:
- Master Owner: Entity owning the master recording rights
- Producer: Producer who receives ongoing royalties
- Songwriter: Songwriter receiving mechanical royalties
- Featured Artist: Featured artist with negotiated royalty share
- Sample Clearance: Original rights holder for sampled content
- Remix Rights: Rights holder for remix permissions';
