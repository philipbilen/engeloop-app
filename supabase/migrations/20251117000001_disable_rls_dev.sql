-- Migration: Disable RLS for Development
-- Description: Temporarily disables RLS on all tables for admin-only development
--              This is safe since there's no public access - only admin users
-- Created: 2025-11-17

-- Disable RLS on all core tables
ALTER TABLE releases DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE release_main_artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE release_contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE track_contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE licensor_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_releases DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatories DISABLE ROW LEVEL SECURITY;
ALTER TABLE artist_memberships DISABLE ROW LEVEL SECURITY;

-- Add comment explaining this is for admin-only development
COMMENT ON TABLE releases IS 'RLS disabled - admin-only tool, no public access';
COMMENT ON TABLE contracts IS 'RLS disabled - admin-only tool, no public access';

-- Note: Re-enable RLS later when adding authentication:
-- ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admin can do anything" ON releases FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
