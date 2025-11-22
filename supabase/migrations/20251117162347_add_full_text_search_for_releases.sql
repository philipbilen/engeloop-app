-- Add full-text search for releases

-- 1. Add search_vector column to releases table
ALTER TABLE releases
ADD COLUMN search_vector tsvector;

-- 2. Create a function to update the search_vector
CREATE OR REPLACE FUNCTION update_releases_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = setweight(to_tsvector('english', NEW.title), 'A') ||
                      setweight(to_tsvector('english', COALESCE(NEW.version, '')), 'B') ||
                      setweight(to_tsvector('english', COALESCE(NEW.internal_catalog_id, '')), 'B') ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                       FROM release_main_artists rma
                       JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                       WHERE rma.release_id = NEW.id) ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                       FROM release_contributors rc
                       JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                       WHERE rc.release_id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers to automatically update search_vector
CREATE OR REPLACE TRIGGER trg_releases_search_vector_insert
BEFORE INSERT ON releases
FOR EACH ROW EXECUTE FUNCTION update_releases_search_vector();

CREATE OR REPLACE TRIGGER trg_releases_search_vector_update
BEFORE UPDATE OF title, version, internal_catalog_id ON releases
FOR EACH ROW EXECUTE FUNCTION update_releases_search_vector();

-- Trigger for changes in release_main_artists
CREATE OR REPLACE FUNCTION trg_update_releases_search_vector_from_main_artists()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE releases
    SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                        setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                         FROM release_main_artists rma
                         JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                         WHERE rma.release_id = NEW.release_id) ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                         FROM release_contributors rc
                         JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                         WHERE rc.release_id = NEW.release_id)
    WHERE id = NEW.release_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE releases
    SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                        setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                         FROM release_main_artists rma
                         JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                         WHERE rma.release_id = OLD.release_id) ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                         FROM release_contributors rc
                         JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                         WHERE rc.release_id = OLD.release_id)
    WHERE id = OLD.release_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_releases_search_vector_from_main_artists
AFTER INSERT OR UPDATE OR DELETE ON release_main_artists
FOR EACH ROW EXECUTE FUNCTION trg_update_releases_search_vector_from_main_artists();

-- Trigger for changes in release_contributors
CREATE OR REPLACE FUNCTION trg_update_releases_search_vector_from_contributors()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE releases
    SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                        setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                         FROM release_main_artists rma
                         JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                         WHERE rma.release_id = NEW.release_id) ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                         FROM release_contributors rc
                         JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                         WHERE rc.release_id = NEW.release_id)
    WHERE id = NEW.release_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE releases
    SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                        setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                         FROM release_main_artists rma
                         JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                         WHERE rma.release_id = OLD.release_id) ||
                        (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                         FROM release_contributors rc
                         JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                         WHERE rc.release_id = OLD.release_id)
    WHERE id = OLD.release_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_releases_search_vector_from_contributors
AFTER INSERT OR UPDATE OR DELETE ON release_contributors
FOR EACH ROW EXECUTE FUNCTION trg_update_releases_search_vector_from_contributors();

-- Trigger for changes in artist_profiles that affect releases
CREATE OR REPLACE FUNCTION trg_update_releases_search_vector_from_artist_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update releases where this artist is a main artist
  UPDATE releases
  SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                      setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                      setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                       FROM release_main_artists rma
                       JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                       WHERE rma.release_id = releases.id) ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                       FROM release_contributors rc
                       JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                       WHERE rc.release_id = releases.id)
  WHERE id IN (SELECT release_id FROM release_main_artists WHERE artist_profile_id = NEW.id);

  -- Update releases where this artist is a contributor
  UPDATE releases
  SET search_vector = setweight(to_tsvector('english', releases.title), 'A') ||
                      setweight(to_tsvector('english', COALESCE(releases.version, '')), 'B') ||
                      setweight(to_tsvector('english', COALESCE(releases.internal_catalog_id, '')), 'B') ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                       FROM release_main_artists rma
                       JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                       WHERE rma.release_id = releases.id) ||
                      (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                       FROM release_contributors rc
                       JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                       WHERE rc.release_id = releases.id)
  WHERE id IN (SELECT release_id FROM release_contributors WHERE artist_profile_id = NEW.id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_releases_search_vector_from_artist_profiles
AFTER UPDATE OF artist_name ON artist_profiles
FOR EACH ROW EXECUTE FUNCTION trg_update_releases_search_vector_from_artist_profiles();


-- 4. Populate search_vector for existing data
UPDATE releases
SET search_vector = setweight(to_tsvector('english', title), 'A') ||
                    setweight(to_tsvector('english', COALESCE(version, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(internal_catalog_id, '')), 'B') ||
                    (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'C')
                     FROM release_main_artists rma
                     JOIN artist_profiles ap ON rma.artist_profile_id = ap.id
                     WHERE rma.release_id = releases.id) ||
                    (SELECT setweight(to_tsvector('english', string_agg(ap.artist_name, ' ')), 'D')
                     FROM release_contributors rc
                     JOIN artist_profiles ap ON rc.artist_profile_id = ap.id
                     WHERE rc.release_id = releases.id);

-- 5. Create GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_releases_search_vector
ON releases USING GIN (search_vector);

-- 6. Modify the search_releases function to use the new search_vector
CREATE OR REPLACE FUNCTION search_releases(query_text TEXT)
RETURNS TABLE (release_id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF query_text IS NULL OR query_text = '' THEN
    RETURN QUERY
    SELECT r.id FROM releases r;
  ELSE
    RETURN QUERY
    SELECT r.id
    FROM releases r
    WHERE r.search_vector @@ websearch_to_tsquery('english', query_text);
  END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_releases(TEXT) IS
'Searches releases using full-text search on a precomputed search_vector, including title, version, catalog number, and associated artist names.';
