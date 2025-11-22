


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."audit_action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."contract_status" AS ENUM (
    'draft',
    'sent',
    'executed',
    'archived'
);


ALTER TYPE "public"."contract_status" OWNER TO "postgres";


CREATE TYPE "public"."contract_term_type" AS ENUM (
    'fixed',
    'perpetual',
    'auto_renew',
    'evergreen_with_notice'
);


ALTER TYPE "public"."contract_term_type" OWNER TO "postgres";


CREATE TYPE "public"."contract_type" AS ENUM (
    'MLA',
    'Release Schedule',
    'Remix Agreement',
    'Other'
);


ALTER TYPE "public"."contract_type" OWNER TO "postgres";


CREATE TYPE "public"."credit_role" AS ENUM (
    'Producer',
    'Composer',
    'Remixer',
    'Featured Artist',
    'Manager',
    'Engineer (Mix)',
    'Engineer (Master)',
    'Engineer (Mix & Master)',
    'Other'
);


ALTER TYPE "public"."credit_role" OWNER TO "postgres";


CREATE TYPE "public"."release_status" AS ENUM (
    'planning',
    'signed',
    'in_progress',
    'delivered',
    'released',
    'archived',
    'ready_for_delivery'
);


ALTER TYPE "public"."release_status" OWNER TO "postgres";


CREATE TYPE "public"."release_type" AS ENUM (
    'Single',
    'EP',
    'Album'
);


ALTER TYPE "public"."release_type" OWNER TO "postgres";


CREATE TYPE "public"."share_role_context" AS ENUM (
    'Main Artist',
    'Producer',
    'Composer',
    'Manager',
    'Other',
    'Featured Artist',
    'Sample Clearance',
    'Remix Rights'
);


ALTER TYPE "public"."share_role_context" OWNER TO "postgres";


COMMENT ON TYPE "public"."share_role_context" IS 'Defines the role/reason for a licensor''s share allocation.
Used in licensor_shares table to document why each contact receives their percentage.
Examples from real contracts:
- Master Owner: Entity owning the master recording rights
- Producer: Producer who receives ongoing royalties
- Songwriter: Songwriter receiving mechanical royalties
- Featured Artist: Featured artist with negotiated royalty share
- Sample Clearance: Original rights holder for sampled content
- Remix Rights: Rights holder for remix permissions';



CREATE OR REPLACE FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[]) RETURNS TABLE("release_id" "uuid", "catalog_id" "text")
    LANGUAGE "plpgsql"
    AS $$
declare
  v_catalog text;
  v_release_id uuid;
begin
  -- Generate catalog number
  v_catalog := public.generate_catalog_number(p_release_date, null);

  -- Insert release
  insert into public.releases (title, type, release_date, internal_catalog_id, status)
  values (p_title, p_type, p_release_date, v_catalog, 'planning')
  returning id into v_release_id;

  -- Insert main artists in order, if provided
  if array_length(p_artist_ids, 1) is not null then
    insert into public.release_main_artists (release_id, artist_profile_id, position)
    select v_release_id, p_artist_ids[i], i
    from generate_subscripts(p_artist_ids, 1) as s(i);
  end if;

  -- Insert default track for Singles
  if p_type = 'Single' then
    insert into public.tracks (release_id, title, position, explicit)
    values (v_release_id, p_title, 0, false);
  end if;

  release_id := v_release_id;
  catalog_id := v_catalog;
  return next;
end;
$$;


ALTER FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[] DEFAULT '{}'::"uuid"[], "p_contributors" "jsonb" DEFAULT '[]'::"jsonb") RETURNS TABLE("release_id" "uuid", "catalog_id" "text")
    LANGUAGE "plpgsql"
    AS $$
declare
  v_catalog text;
  v_release_id uuid;
  v_track_id uuid;
begin
  -- Generate catalog number
  v_catalog := public.generate_catalog_number(p_release_date, null);

  -- Insert release
  insert into public.releases (title, type, release_date, internal_catalog_id, status)
  values (p_title, p_type, p_release_date, v_catalog, 'planning')
  returning id into v_release_id;

  -- Insert main artists in order, if provided
  if array_length(p_artist_ids, 1) is not null then
    insert into public.release_main_artists (release_id, artist_profile_id, position)
    select v_release_id, p_artist_ids[i], i
    from generate_subscripts(p_artist_ids, 1) as s(i);
  end if;

  -- Insert default track and inherit artists/contributors for Singles
  if p_type = 'Single' then
    insert into public.tracks (release_id, title, position, explicit)
    values (v_release_id, p_title, 0, false)
    returning id into v_track_id;

    -- Inherit main artists onto the track
    if array_length(p_artist_ids, 1) is not null then
      insert into public.track_main_artists (track_id, artist_profile_id, position, inherited_from_release)
      select v_track_id, p_artist_ids[i], i, true
      from generate_subscripts(p_artist_ids, 1) as s(i);
    end if;

    -- Inherit contributors onto the track
    insert into public.track_contributors (track_id, artist_profile_id, role, role_custom, inherited_from_release)
    select
      v_track_id,
      contrib.artist_profile_id,
      contrib.role,
      contrib.role_custom,
      true
    from jsonb_to_recordset(p_contributors) as contrib(
      artist_profile_id uuid,
      role public.credit_role,
      role_custom text
    );
  end if;

  release_id := v_release_id;
  catalog_id := v_catalog;
  return next;
end;
$$;


ALTER FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[], "p_contributors" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_catalog_number"("p_release_date" "date" DEFAULT NULL::"date", "p_base_catalog_id" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$DECLARE
  v_year TEXT;
  v_highest_num INT;
  v_next_num TEXT;
  v_suffix CHAR(1);
BEGIN
  -- Determine year from release_date or use current year
  v_year := COALESCE(EXTRACT(YEAR FROM p_release_date)::TEXT, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT);

  -- If base catalog ID provided, generate variant suffix (A, B, C, etc.)
  IF p_base_catalog_id IS NOT NULL THEN
    -- Find highest existing suffix for this base catalog number
    SELECT MAX(RIGHT(internal_catalog_id, 1))
    INTO v_suffix
    FROM releases
    WHERE internal_catalog_id LIKE p_base_catalog_id || '%'
    AND LENGTH(internal_catalog_id) = LENGTH(p_base_catalog_id) + 1
    AND internal_catalog_id ~ ('^' || p_base_catalog_id || '[A-Z]$');

    -- If no suffix exists yet, return base + 'A'
    IF v_suffix IS NULL THEN
      RETURN p_base_catalog_id || 'A';
    ELSE
      -- Increment suffix (A -> B, B -> C, etc.)
      RETURN p_base_catalog_id || CHR(ASCII(v_suffix) + 1);
    END IF;
  END IF;

  -- Generate base catalog number (ENG-YYYY-NNN)
  -- Find highest number for this year (ignoring variant suffixes)
  SELECT MAX(SUBSTRING(internal_catalog_id FROM 10)::INT)
  INTO v_highest_num
  FROM releases
  WHERE internal_catalog_id LIKE 'ENG-' || v_year || '-%'
  AND internal_catalog_id ~ '^ENG-[0-9]{4}-[0-9]{3}$';

  -- Increment and zero-pad to 3 digits
  v_next_num := LPAD((COALESCE(v_highest_num, 0) + 1)::TEXT, 3, '0');

  -- Return formatted catalog number
  RETURN 'ENG-' || v_year || '-' || v_next_num;
END;$_$;


ALTER FUNCTION "public"."generate_catalog_number"("p_release_date" "date", "p_base_catalog_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_catalog_number"("p_release_date" "date", "p_base_catalog_id" "text") IS 'Generates catalog numbers for releases.
Base format: ENG-YYYY-NNN (e.g., ENG-2025-012)
Variant format: ENG-YYYY-NNNA (e.g., ENG-2025-012A)
Pass p_base_catalog_id to generate variant suffix.';



CREATE OR REPLACE FUNCTION "public"."search_releases"("query_text" "text") RETURNS TABLE("release_id" "uuid")
    LANGUAGE "plpgsql" STABLE
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


ALTER FUNCTION "public"."search_releases"("query_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_releases"("query_text" "text") IS 'Searches releases using full-text search on a precomputed search_vector, including title, version, catalog number, and associated artist names.';



CREATE OR REPLACE FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_update_releases_search_vector_from_contributors"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_update_releases_search_vector_from_contributors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_releases_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_releases_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") RETURNS TABLE("all_valid" boolean, "invalid_tracks" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") IS 'Validates licensor shares for all tracks in a release.
Returns whether all tracks are valid and a JSON array of invalid tracks.
Used to block status progression to "delivered" or "released" if shares are incomplete.

Invalid tracks are those where:
1. Pool shares sum > 100%, OR
2. Pool shares sum < 100% without documented flat fees (0% shares with notes), OR
3. Pool shares sum != 100% (exact)

Warning state (valid but < 100%): Pool shares < 100% WITH documented flat fees is allowed.';



CREATE OR REPLACE FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") RETURNS TABLE("is_valid" boolean, "pool_sum" numeric, "final_ntc_sum" numeric, "licensor_pool_percent" numeric, "has_flat_fees" boolean)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") IS 'Validates licensor shares for a single track.
Returns validation status, pool share sum, final NTC sum, and flat fee indicator.
Validation rules:
- VALID: pool shares sum to 100%
- WARNING (valid): pool shares < 100% with documented flat fees (share_percent=0 with notes)
- INVALID: pool shares > 100% OR pool shares < 100% without flat fee documentation';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artist_memberships" (
    "artist_profile_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artist_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_name" "text" NOT NULL,
    "spotify_url" "text",
    "apple_music_url" "text",
    "bio" "text",
    "press_photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artist_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_legal_name" "text" NOT NULL,
    "company_name" "text",
    "email" "text" NOT NULL,
    "payout_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "full_postal_address" "text"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."artist_search_index" AS
 SELECT "ap"."id" AS "artist_profile_id",
    "ap"."artist_name",
    "string_agg"("c"."full_legal_name", ' | '::"text") AS "associated_legal_names"
   FROM (("public"."artist_profiles" "ap"
     LEFT JOIN "public"."artist_memberships" "am" ON (("ap"."id" = "am"."artist_profile_id")))
     LEFT JOIN "public"."contacts" "c" ON (("am"."contact_id" = "c"."id")))
  GROUP BY "ap"."id", "ap"."artist_name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."artist_search_index" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL
);


ALTER TABLE "public"."artist_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_releases" (
    "contract_id" "uuid" NOT NULL,
    "release_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_releases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_signatories" (
    "contract_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_signatories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_type" "public"."contract_type" NOT NULL,
    "contract_type_custom" "text",
    "status" "public"."contract_status" NOT NULL,
    "document_url" "text",
    "executed_at" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "label_share_percent" numeric(5,2),
    "licensor_pool_percent" numeric(5,2),
    "territory" "text",
    "term_type" "public"."contract_term_type",
    "term_value_years" integer,
    "auto_renew_interval_years" integer,
    "notice_period_days" integer,
    "effective_at" "date",
    "expires_at" "date",
    CONSTRAINT "contracts_label_share_percent_check" CHECK ((("label_share_percent" >= (0)::numeric) AND ("label_share_percent" <= (100)::numeric))),
    CONSTRAINT "contracts_licensor_pool_percent_check" CHECK ((("licensor_pool_percent" >= (0)::numeric) AND ("licensor_pool_percent" <= (100)::numeric))),
    CONSTRAINT "contracts_shares_sum_check" CHECK ((("label_share_percent" + "licensor_pool_percent") = (100)::numeric))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contracts"."label_share_percent" IS 'Label''s percentage of NetToCompany (e.g., 50%). Must sum with licensor_pool_percent to 100%.';



COMMENT ON COLUMN "public"."contracts"."licensor_pool_percent" IS 'Total pool allocated to licensors as % of NetToCompany (e.g., 50%).
Individual licensor_shares.share_percent values represent shares of THIS pool, not of NetToCompany directly.
Final % of NetToCompany = (licensor_shares.share_percent × licensor_pool_percent) / 100';



COMMENT ON CONSTRAINT "contracts_shares_sum_check" ON "public"."contracts" IS 'Ensures label share + licensor pool = 100%.
Example: Label 50% + Licensor Pool 50% = 100%
Then if a licensor has 40% of pool: Final NTC = 0.40 × 50% = 20%';



CREATE TABLE IF NOT EXISTS "public"."licensor_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "track_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "share_percent" numeric(5,2) NOT NULL,
    "role_context" "public"."share_role_context" NOT NULL,
    "role_context_custom" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "licensor_shares_share_percent_check" CHECK ((("share_percent" >= (0)::numeric) AND ("share_percent" <= (100)::numeric)))
);


ALTER TABLE "public"."licensor_shares" OWNER TO "postgres";


COMMENT ON COLUMN "public"."licensor_shares"."share_percent" IS 'Percentage of the licensor pool (NOT direct % of NetToCompany).
Can be 0% for flat fee scenarios - in this case, notes field MUST document the flat fee arrangement.
Final % of NetToCompany = (share_percent × contract.licensor_pool_percent) / 100';



COMMENT ON COLUMN "public"."licensor_shares"."notes" IS 'Optional notes about this licensor share.
REQUIRED when share_percent = 0 to document flat fee arrangements.
Examples: "Flat fee paid on signing", "Producer received $5000 upfront", "Includes assignment to [name]"';



CREATE OR REPLACE VIEW "public"."licensor_shares_with_contacts" AS
 SELECT "ls"."id",
    "ls"."track_id",
    "ls"."contact_id",
    "c"."full_legal_name",
    "c"."email",
    "ls"."share_percent",
    "ls"."role_context",
    "ls"."role_context_custom",
    "ls"."notes",
    "ls"."created_at"
   FROM ("public"."licensor_shares" "ls"
     JOIN "public"."contacts" "c" ON (("c"."id" = "ls"."contact_id")));


ALTER VIEW "public"."licensor_shares_with_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."release_contributors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release_id" "uuid" NOT NULL,
    "artist_profile_id" "uuid" NOT NULL,
    "role" "public"."credit_role" NOT NULL,
    "role_custom" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."release_contributors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."release_main_artists" (
    "release_id" "uuid" NOT NULL,
    "artist_profile_id" "uuid" NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE "public"."release_main_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."releases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "version" "text",
    "type" "public"."release_type" NOT NULL,
    "internal_catalog_id" "text" NOT NULL,
    "upc" "text",
    "release_date" "date",
    "primary_genre" "text",
    "cover_art_url" "text",
    "status" "public"."release_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "search_vector" "tsvector"
);


ALTER TABLE "public"."releases" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."releases_with_display_title" AS
 SELECT "id",
    "title",
    "version",
        CASE
            WHEN (("version" IS NOT NULL) AND ("version" <> ''::"text")) THEN ((("title" || ' ('::"text") || "version") || ')'::"text")
            ELSE "title"
        END AS "display_title"
   FROM "public"."releases";


ALTER VIEW "public"."releases_with_display_title" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_contributors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "track_id" "uuid" NOT NULL,
    "artist_profile_id" "uuid" NOT NULL,
    "role" "public"."credit_role" NOT NULL,
    "role_custom" "text",
    "inherited_from_release" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."track_contributors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_main_artists" (
    "track_id" "uuid" NOT NULL,
    "artist_profile_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "inherited_from_release" boolean DEFAULT false
);


ALTER TABLE "public"."track_main_artists" OWNER TO "postgres";


COMMENT ON TABLE "public"."track_main_artists" IS 'RLS disabled for development (admin-only usage)';



CREATE TABLE IF NOT EXISTS "public"."tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "release_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "version" "text",
    "isrc" "text",
    "duration_ms" integer,
    "explicit" boolean DEFAULT false,
    "language" "text",
    "master_file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_title" "text",
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."tracks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."tracks_with_display_title" AS
 SELECT "id",
    "release_id",
    "title",
    "version",
        CASE
            WHEN (("version" IS NOT NULL) AND ("version" <> ''::"text")) THEN ((("title" || ' ('::"text") || "version") || ')'::"text")
            ELSE "title"
        END AS "display_title"
   FROM "public"."tracks";


ALTER VIEW "public"."tracks_with_display_title" OWNER TO "postgres";


ALTER TABLE ONLY "public"."artist_memberships"
    ADD CONSTRAINT "artist_memberships_pkey" PRIMARY KEY ("artist_profile_id", "contact_id");



ALTER TABLE ONLY "public"."artist_profiles"
    ADD CONSTRAINT "artist_profiles_artist_name_key" UNIQUE ("artist_name");



ALTER TABLE ONLY "public"."artist_profiles"
    ADD CONSTRAINT "artist_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_users"
    ADD CONSTRAINT "artist_users_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."artist_users"
    ADD CONSTRAINT "artist_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_releases"
    ADD CONSTRAINT "contract_releases_pkey" PRIMARY KEY ("contract_id", "release_id");



ALTER TABLE ONLY "public"."contract_signatories"
    ADD CONSTRAINT "contract_signatories_pkey" PRIMARY KEY ("contract_id", "contact_id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."licensor_shares"
    ADD CONSTRAINT "licensor_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."licensor_shares"
    ADD CONSTRAINT "licensor_shares_track_id_contact_id_key" UNIQUE ("track_id", "contact_id");



ALTER TABLE ONLY "public"."release_contributors"
    ADD CONSTRAINT "release_contributors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."release_contributors"
    ADD CONSTRAINT "release_contributors_release_artist_key" UNIQUE ("release_id", "artist_profile_id");



ALTER TABLE ONLY "public"."release_main_artists"
    ADD CONSTRAINT "release_main_artists_pkey" PRIMARY KEY ("release_id", "artist_profile_id");



ALTER TABLE ONLY "public"."release_main_artists"
    ADD CONSTRAINT "release_main_artists_release_id_position_key" UNIQUE ("release_id", "position");



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_internal_catalog_id_key" UNIQUE ("internal_catalog_id");



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_upc_key" UNIQUE ("upc");



ALTER TABLE ONLY "public"."track_contributors"
    ADD CONSTRAINT "track_contributors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_contributors"
    ADD CONSTRAINT "track_contributors_track_artist_role_key" UNIQUE ("track_id", "artist_profile_id", "role");



ALTER TABLE ONLY "public"."track_main_artists"
    ADD CONSTRAINT "track_main_artists_pkey" PRIMARY KEY ("track_id", "artist_profile_id");



ALTER TABLE ONLY "public"."track_main_artists"
    ADD CONSTRAINT "track_main_artists_track_id_position_key" UNIQUE ("track_id", "position");



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_isrc_key" UNIQUE ("isrc");



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_artist_profiles_artist_name_trgm" ON "public"."artist_profiles" USING "gin" ("artist_name" "public"."gin_trgm_ops");



COMMENT ON INDEX "public"."idx_artist_profiles_artist_name_trgm" IS 'Enable fast ILIKE search on artist names';



CREATE INDEX "idx_release_contributors_artist_profile_id" ON "public"."release_contributors" USING "btree" ("artist_profile_id");



CREATE INDEX "idx_release_contributors_release_id" ON "public"."release_contributors" USING "btree" ("release_id");



COMMENT ON INDEX "public"."idx_release_contributors_release_id" IS 'Improve release contributor joins';



CREATE INDEX "idx_release_main_artists_artist_profile_id" ON "public"."release_main_artists" USING "btree" ("artist_profile_id");



CREATE INDEX "idx_release_main_artists_release_id" ON "public"."release_main_artists" USING "btree" ("release_id");



COMMENT ON INDEX "public"."idx_release_main_artists_release_id" IS 'Improve release artist joins';



CREATE INDEX "idx_releases_catalog_id" ON "public"."releases" USING "btree" ("internal_catalog_id");



CREATE INDEX "idx_releases_search_vector" ON "public"."releases" USING "gin" ("search_vector");



CREATE INDEX "idx_releases_status" ON "public"."releases" USING "btree" ("status");



CREATE INDEX "idx_releases_title_trgm" ON "public"."releases" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_tracks_release_position" ON "public"."tracks" USING "btree" ("release_id", "position");



CREATE OR REPLACE TRIGGER "trg_releases_search_vector_insert" BEFORE INSERT ON "public"."releases" FOR EACH ROW EXECUTE FUNCTION "public"."update_releases_search_vector"();



CREATE OR REPLACE TRIGGER "trg_releases_search_vector_update" BEFORE UPDATE OF "title", "version", "internal_catalog_id" ON "public"."releases" FOR EACH ROW EXECUTE FUNCTION "public"."update_releases_search_vector"();



CREATE OR REPLACE TRIGGER "trg_update_releases_search_vector_from_artist_profiles" AFTER UPDATE OF "artist_name" ON "public"."artist_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"();



CREATE OR REPLACE TRIGGER "trg_update_releases_search_vector_from_contributors" AFTER INSERT OR DELETE OR UPDATE ON "public"."release_contributors" FOR EACH ROW EXECUTE FUNCTION "public"."trg_update_releases_search_vector_from_contributors"();



CREATE OR REPLACE TRIGGER "trg_update_releases_search_vector_from_main_artists" AFTER INSERT OR DELETE OR UPDATE ON "public"."release_main_artists" FOR EACH ROW EXECUTE FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"();



ALTER TABLE ONLY "public"."artist_memberships"
    ADD CONSTRAINT "artist_memberships_artist_profile_id_fkey" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_memberships"
    ADD CONSTRAINT "artist_memberships_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_users"
    ADD CONSTRAINT "artist_users_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artist_users"
    ADD CONSTRAINT "artist_users_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."contract_releases"
    ADD CONSTRAINT "contract_releases_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_releases"
    ADD CONSTRAINT "contract_releases_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_signatories"
    ADD CONSTRAINT "contract_signatories_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_signatories"
    ADD CONSTRAINT "contract_signatories_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."licensor_shares"
    ADD CONSTRAINT "licensor_shares_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."licensor_shares"
    ADD CONSTRAINT "licensor_shares_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."release_contributors"
    ADD CONSTRAINT "release_contributors_artist_profile_id_fkey" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."release_contributors"
    ADD CONSTRAINT "release_contributors_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."release_main_artists"
    ADD CONSTRAINT "release_main_artists_artist_profile_id_fkey" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."release_main_artists"
    ADD CONSTRAINT "release_main_artists_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_contributors"
    ADD CONSTRAINT "track_contributors_artist_profile_id_fkey" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."track_contributors"
    ADD CONSTRAINT "track_contributors_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_main_artists"
    ADD CONSTRAINT "track_main_artists_artist_profile_id_fkey" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."track_main_artists"
    ADD CONSTRAINT "track_main_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE CASCADE;



CREATE POLICY "Enable insert for all users" ON "public"."contacts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."artist_profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."contacts" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."releases" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."tracks" FOR SELECT USING (true);



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[], "p_contributors" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[], "p_contributors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_release_full"("p_title" "text", "p_type" "public"."release_type", "p_release_date" "date", "p_artist_ids" "uuid"[], "p_contributors" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_catalog_number"("p_release_date" "date", "p_base_catalog_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_catalog_number"("p_release_date" "date", "p_base_catalog_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_catalog_number"("p_release_date" "date", "p_base_catalog_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_releases"("query_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_releases"("query_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_releases"("query_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_artist_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_contributors"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_contributors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_contributors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_update_releases_search_vector_from_main_artists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_releases_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_releases_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_releases_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_release_shares"("p_release_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_track_shares"("p_track_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";
























GRANT ALL ON TABLE "public"."artist_memberships" TO "anon";
GRANT ALL ON TABLE "public"."artist_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."artist_profiles" TO "anon";
GRANT ALL ON TABLE "public"."artist_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."artist_search_index" TO "anon";
GRANT ALL ON TABLE "public"."artist_search_index" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_search_index" TO "service_role";



GRANT ALL ON TABLE "public"."artist_users" TO "anon";
GRANT ALL ON TABLE "public"."artist_users" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_users" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."contract_releases" TO "anon";
GRANT ALL ON TABLE "public"."contract_releases" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_releases" TO "service_role";



GRANT ALL ON TABLE "public"."contract_signatories" TO "anon";
GRANT ALL ON TABLE "public"."contract_signatories" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_signatories" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."licensor_shares" TO "anon";
GRANT ALL ON TABLE "public"."licensor_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."licensor_shares" TO "service_role";



GRANT ALL ON TABLE "public"."licensor_shares_with_contacts" TO "anon";
GRANT ALL ON TABLE "public"."licensor_shares_with_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."licensor_shares_with_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."release_contributors" TO "anon";
GRANT ALL ON TABLE "public"."release_contributors" TO "authenticated";
GRANT ALL ON TABLE "public"."release_contributors" TO "service_role";



GRANT ALL ON TABLE "public"."release_main_artists" TO "anon";
GRANT ALL ON TABLE "public"."release_main_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."release_main_artists" TO "service_role";



GRANT ALL ON TABLE "public"."releases" TO "anon";
GRANT ALL ON TABLE "public"."releases" TO "authenticated";
GRANT ALL ON TABLE "public"."releases" TO "service_role";



GRANT ALL ON TABLE "public"."releases_with_display_title" TO "anon";
GRANT ALL ON TABLE "public"."releases_with_display_title" TO "authenticated";
GRANT ALL ON TABLE "public"."releases_with_display_title" TO "service_role";



GRANT ALL ON TABLE "public"."track_contributors" TO "anon";
GRANT ALL ON TABLE "public"."track_contributors" TO "authenticated";
GRANT ALL ON TABLE "public"."track_contributors" TO "service_role";



GRANT ALL ON TABLE "public"."track_main_artists" TO "anon";
GRANT ALL ON TABLE "public"."track_main_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."track_main_artists" TO "service_role";



GRANT ALL ON TABLE "public"."tracks" TO "anon";
GRANT ALL ON TABLE "public"."tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."tracks" TO "service_role";



GRANT ALL ON TABLE "public"."tracks_with_display_title" TO "anon";
GRANT ALL ON TABLE "public"."tracks_with_display_title" TO "authenticated";
GRANT ALL ON TABLE "public"."tracks_with_display_title" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































