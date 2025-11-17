-- Migration: Catalog Number Generation Function
-- Description: Creates a PostgreSQL function to generate catalog numbers in format ENG-YYYY-NNN (base) or ENG-YYYY-NNNA/B/C (variants)
-- Created: 2025-11-16

CREATE OR REPLACE FUNCTION generate_catalog_number(
  p_release_date DATE DEFAULT NULL,
  p_base_catalog_id TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
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
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining function usage
COMMENT ON FUNCTION generate_catalog_number IS
'Generates catalog numbers for releases.
Base format: ENG-YYYY-NNN (e.g., ENG-2025-012)
Variant format: ENG-YYYY-NNNA (e.g., ENG-2025-012A)
Pass p_base_catalog_id to generate variant suffix.';
