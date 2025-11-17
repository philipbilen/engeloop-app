---
type: technical-spec
status: decided
context: ["systems-data", "operations", "legal-financial"]
category: ["data-model", "schema", "infrastructure", "release-management", "metadata"]
tags: ["database-design", "postgresql", "schema", "data-integrity", "metadata", "release-management"]
---

engeloop-records-final-data-model-schema

## Context
This document outlines the final, decided-upon database schema for the Engeloop Records operational system. The primary goal is to create a robust, scalable data model that formally implements the label's core principle: the **strict separation of financial rights (payouts) from public-facing credits (metadata)**.

The design process evolved from an initial model that conflated legal (`Contacts`) and brand (`Artists`) entities. This was identified as a critical flaw, as it created operational bottlenecks (e.g., being unable to search for "Dawda" to add a credit, and instead having to search for "David Jassy").

The resulting schema is a "3-pillar" hybrid model that solves this ambiguity by establishing three distinct core entity types:
1.  **`contacts`**: The legal/financial entities who sign contracts and receive payments.
2.  **`artist_profiles`**: The public/brand entities that receive credits.
3.  **`releases` / `tracks`**: The commercial products being sold.

## Key Decisions
- **`artist_profiles` is the Single Source of Truth:** This is the most critical decision. The `artist_profiles` table will be the master list for *ALL* public-facing names. This includes major artists ("Naarly"), producers, remixers, and even one-off mix engineers ("John Smith"). This table is what will be searched when adding any public credit.
- **Rejection of `display_name` Field:** The initial hybrid schema included a `display_name` text field on contributor tables. This was explicitly rejected because it breaks the single source of truth, invites data-entry errors (typos), and creates "dead" data that cannot be linked to a profile.
- **Formal Separation of Links:** The core principle is enforced by the schema's relations:
    - **Financial Links:** `licensor_shares` (Schedule A) links *only* to `contact_id`.
    - **Metadata Links:** All credit tables (`release_main_artists`, `track_main_artists`, `release_contributors`, `track_contributors`) link *only* to `artist_profile_id`.
- **Handling Groups/Collectives:** The `artist_memberships` junction table solves the "group" problem by linking a single `artist_profile_id` (e.g., "Swedish House Mafia") to multiple `contact_id`s (the individual members).
- **Handling Ordered Credits:** The `position` field (e.g., in `release_main_artists`) is essential for managing the *order* of artists, enabling correct formatting like "Artist 1 & Artist 2".
- **Handling Inheritance:** The `inherited_from_release` boolean flag (e.g., in `track_contributors`) is a pragmatic solution to the "apply to all tracks" workflow, allowing the system to track the provenance of a credit.
- **Data Integrity via ENUMs:** To prevent data corruption from free-text fields, PostgreSQL `ENUM` types will be used for all fields with a defined set of options (e.g., `status`, `role`, `contract_type`).
- **Optimized Search:** A materialized view (`artist_search_index`) will be created to combine `artist_profiles.artist_name` and `contacts.legal_name`. This allows the user interface to search for "Dawda" or "David Jassy" and resolve to the same `artist_profile` entity.

## Technical Details
The following is the complete, agreed-upon PostgreSQL schema design.

### Custom Type Definitions (ENUMs)
```sql
-- Represents the status of a release
CREATE TYPE release_status AS ENUM (
    'planning',
    'signed',
    'in_progress',
    'delivered',
    'released',
    'archived'
);

-- Represents the commercial type of a release
CREATE TYPE release_type AS ENUM (
    'Single',
    'EP',
    'Album'
);

-- Represents the status of a legal contract
CREATE TYPE contract_status AS ENUM (
    'draft',
    'sent',
    'executed',
    'archived'
);

-- Represents the type of legal contract
CREATE TYPE contract_type AS ENUM (
    'MLA',
    'Release Schedule',
    'Remix Agreement',
    'Other'
);

-- Represents the role of a contributor (public credit)
CREATE TYPE credit_role AS ENUM (
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

-- Represents the internal context for a financial share
CREATE TYPE share_role_context AS ENUM (
    'Main Artist',
    'Producer',
    'Composer',
    'Manager',
    'Other'
);

-- Represents the action taken in the audit log
CREATE TYPE audit_action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE'
);
```

### Core Pillar Tables
```sql
-- Pillar 1: Legal/Financial Entities
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL UNIQUE,
    payout_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pillar 2: Public/Brand Entities
CREATE TABLE artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_name TEXT NOT NULL UNIQUE,
    spotify_url TEXT,
    apple_music_url TEXT,
    bio TEXT,
    press_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pillar 3: Commercial Products (Releases)
CREATE TABLE releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    version TEXT,
    type release_type NOT NULL,
    internal_catalog_id TEXT NOT NULL UNIQUE,
    upc TEXT UNIQUE,
    release_date DATE,
    primary_genre TEXT,
    cover_art_url TEXT,
    status release_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pillar 3: Commercial Products (Tracks)
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    version TEXT,
    isrc TEXT UNIQUE,
    duration_ms INT,
    explicit BOOLEAN DEFAULT false,
    language TEXT,
    master_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Junction Tables (Connecting the Pillars)
```sql
-- Links Artists (Brands) to Contacts (Legal)
CREATE TABLE artist_memberships (
    artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (artist_profile_id, contact_id)
);

-- Links Main Artists (Credits) to Releases
CREATE TABLE release_main_artists (
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
    position INT NOT NULL,
    PRIMARY KEY (release_id, artist_profile_id),
    UNIQUE (release_id, position)
);

-- Links Main Artists (Credits) to Tracks
CREATE TABLE track_main_artists (
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
    position INT NOT NULL,
    inherited_from_release BOOLEAN DEFAULT false,
    PRIMARY KEY (track_id, artist_profile_id),
    UNIQUE (track_id, position)
);

-- Links Contributors (Credits) to Releases
CREATE TABLE release_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
    role credit_role NOT NULL,
    role_custom TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Links Contributors (Credits) to Tracks
CREATE TABLE track_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
    role credit_role NOT NULL,
    role_custom TEXT,
    inherited_from_release BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Financial & Legal Tables
```sql
-- Master library of legal documents
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_type contract_type NOT NULL,
    contract_type_custom TEXT,
    status contract_status NOT NULL,
    document_url TEXT,
    executed_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Links Contracts to their Signatories (Contacts)
CREATE TABLE contract_signatories (
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (contract_id, contact_id)
);

-- Links Contracts to the Releases they govern
CREATE TABLE contract_releases (
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (contract_id, release_id)
);

-- Defines financial payouts (Schedule A)
CREATE TABLE licensor_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    share_percent DECIMAL(5, 2) NOT NULL CHECK (share_percent > 0 AND share_percent <= 100),
    role_context share_role_context NOT NULL,
    role_context_custom TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (track_id, contact_id)
);
```

### Audit & System Tables
```sql
-- Complete change history for key tables
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMPTZ DEFAULT now()
);
```

### Views & Computed Fields
```sql
-- View for clean release titles
CREATE VIEW releases_with_display_title AS
SELECT
    id,
    title,
    version,
    CASE
        WHEN version IS NOT NULL AND version != '' THEN title || ' (' || version || ')'
        ELSE title
    END AS display_title
FROM
    releases;

-- View for clean track titles
CREATE VIEW tracks_with_display_title AS
SELECT
    id,
    release_id,
    title,
    version,
    CASE
        WHEN version IS NOT NULL AND version != '' THEN title || ' (' || version || ')'
        ELSE title
    END AS display_title
FROM
    tracks;

-- Materialized view for powerful, fast search
CREATE MATERIALIZED VIEW artist_search_index AS
SELECT
    ap.id AS artist_profile_id,
    ap.artist_name,
    STRING_AGG(c.legal_name, ' | ') AS associated_legal_names
FROM
    artist_profiles ap
LEFT JOIN
    artist_memberships am ON ap.id = am.artist_profile_id
LEFT JOIN
    contacts c ON am.contact_id = c.id
GROUP BY
    ap.id, ap.artist_name;

-- Function to generate artist display string (e.g., "Artist 1 & Artist 2")
-- Implementation for get_artist_display_line() would be defined here.
```

## Next Steps
- Implement this schema in a PostgreSQL database.
- Create the triggers necessary to populate the `audit_log` table.
- Define and implement the `get_artist_display_line()` function.
- Begin building the application logic (e.g., API, frontend) that interacts with this schema.
- Periodically refresh the `artist_search_index` materialized view or set up a trigger for it.