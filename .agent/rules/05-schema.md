---
trigger: always_on
---

# Database Schema & Types

*Source: `database.types.ts`*

## Core Tables (The 3 Pillars)

### 1. Contacts (Legal/Financial)
*Table: `public.contacts`*
* `id` (uuid)
* `full_legal_name` (string) - **Source of truth for contracts.**
* `email` (string, unique)
* `company_name` (string | null)
* `full_postal_address` (string | null)
* `payout_info` (json | null)

### 2. Artist Profiles (Public Credits)
*Table: `public.artist_profiles`*
* `id` (uuid)
* `artist_name` (string, unique) - **Source of truth for DSPs.**
* `spotify_url` (string | null)
* `apple_music_url` (string | null)

### 3. Releases & Tracks (Product)
*Table: `public.releases`*
* `id` (uuid)
* `title` (string)
* `version` (string | null)
* `type` (enum: `release_type`)
* `internal_catalog_id` (string, unique)
* `status` (enum: `release_status`)
* `release_date` (string | null)
* `upc` (string | null)
* `search_vector` (tsvector)

*Table: `public.tracks`*
* `id` (uuid)
* `release_id` (uuid)
* `title` (string)
* `version` (string | null)
* `isrc` (string | null)
* `duration_ms` (number | null)
* `position` (number)

## Relationships & Junctions

### Artist Links
* `artist_memberships`: Links `artist_profile_id` -> `contact_id`.
* `release_main_artists`: Links `release_id` -> `artist_profile_id` (with `position`).
* `track_main_artists`: Links `track_id` -> `artist_profile_id` (with `position`, `inherited_from_release`).
* `release_contributors`: Links `release_id` -> `artist_profile_id` (with `role`).
* `track_contributors`: Links `track_id` -> `artist_profile_id` (with `role`, `inherited_from_release`).

### Legal Links
* `contracts`: The agreement document.
    * `label_share_percent` (number)
    * `licensor_pool_percent` (number)
    * `status` (enum: `contract_status`)
* `contract_signatories`: Links `contract_id` -> `contact_id` (The people signing).
* `contract_releases`: Links `contract_id` -> `release_id` (The release covered).

### Financial Links (CRITICAL)
* `licensor_shares`: The specific split per track.
    * `track_id` (FK)
    * `contact_id` (FK -> **contacts**) - **Money goes to Contacts, NOT Artist Profiles.**
    * `share_percent` (number) - Share of the *Licensor Pool*.
    * `role_context` (enum: `share_role_context`)

## Enums (Strict Values)

* **`release_status`**: 'planning', 'signed', 'in_progress', 'ready_for_delivery', 'delivered', 'released', 'archived'
* **`release_type`**: 'Single', 'EP', 'Album'
* **`contract_status`**: 'draft', 'sent', 'executed', 'archived'
* **`credit_role`**: 'Producer', 'Composer', 'Remixer', 'Featured Artist', 'Manager', 'Engineer (Mix)', 'Engineer (Master)', 'Engineer (Mix & Master)', 'Other'
* **`share_role_context`**: 'Main Artist', 'Producer', 'Composer', 'Manager', 'Featured Artist', 'Sample Clearance', 'Remix Rights', 'Other'

## RPC Functions (Server-Side Logic)

1.  `search_releases(query_text: string)`
    * Returns: `{ release_id }[]`
    * *Use for the global search bar.*
2.  `generate_catalog_number(p_release_date, p_base_catalog_id)`
    * Returns: `string`
    * *Use when creating a release.*
3.  `create_release_full(...)`
    * *Atomic creation of release + catalog ID + default track.*
4.  `validate_track_shares(p_track_id)`
    * Returns: `{ is_valid, pool_sum, final_ntc_sum, licensor_pool_percent, has_flat_fees }`
    * *Use in the Financials tab.*
5.  `validate_release_shares(p_release_id)`
    * Returns: `{ all_valid, invalid_tracks }`
    * *Use before changing status to 'delivered'.*