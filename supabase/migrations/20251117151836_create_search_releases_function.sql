-- Create comprehensive search function for releases
CREATE OR REPLACE FUNCTION search_releases(query_text TEXT)
RETURNS TABLE (release_id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Return all release IDs if no search query
  IF query_text IS NULL OR query_text = '' THEN
    RETURN QUERY
    SELECT r.id FROM releases r;
  ELSE
    -- Search across releases, main artists, and contributors
    RETURN QUERY
    SELECT DISTINCT r.id
    FROM releases r
    LEFT JOIN release_main_artists rma ON r.id = rma.release_id
    LEFT JOIN artist_profiles ap_main ON rma.artist_profile_id = ap_main.id
    LEFT JOIN release_contributors rc ON r.id = rc.release_id
    LEFT JOIN artist_profiles ap_contrib ON rc.artist_profile_id = ap_contrib.id
    WHERE
      r.title ILIKE '%' || query_text || '%' OR
      COALESCE(r.version, '') ILIKE '%' || query_text || '%' OR
      COALESCE(r.internal_catalog_id, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_main.stage_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_main.full_legal_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_contrib.stage_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_contrib.full_legal_name, '') ILIKE '%' || query_text || '%';
  END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_releases(TEXT) IS
'Searches releases by title, version, catalog number, and associated artist names (both main artists and contributors)';
