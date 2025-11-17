-- Add indexes to improve search_releases performance

-- Index for release_main_artists lookups
CREATE INDEX IF NOT EXISTS idx_release_main_artists_release_id
ON release_main_artists(release_id);

CREATE INDEX IF NOT EXISTS idx_release_main_artists_artist_profile_id
ON release_main_artists(artist_profile_id);

-- Index for release_contributors lookups
CREATE INDEX IF NOT EXISTS idx_release_contributors_release_id
ON release_contributors(release_id);

CREATE INDEX IF NOT EXISTS idx_release_contributors_artist_profile_id
ON release_contributors(artist_profile_id);

-- Index for artist_profiles text search
CREATE INDEX IF NOT EXISTS idx_artist_profiles_stage_name_trgm
ON artist_profiles USING gin (stage_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_legal_name_trgm
ON artist_profiles USING gin (full_legal_name gin_trgm_ops);

-- Index for releases text search
CREATE INDEX IF NOT EXISTS idx_releases_title_trgm
ON releases USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_releases_catalog_id
ON releases(internal_catalog_id);

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comments
COMMENT ON INDEX idx_release_main_artists_release_id IS 'Improve release artist joins';
COMMENT ON INDEX idx_release_contributors_release_id IS 'Improve release contributor joins';
COMMENT ON INDEX idx_artist_profiles_stage_name_trgm IS 'Enable fast ILIKE search on artist names';
