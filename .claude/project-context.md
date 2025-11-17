# Engeloop Records Release Management System

## Project Overview

Independent electronic music label management system built on Supabase + Next.js.
Primary focus: Afro House releases, expanding to other genres.
Core principle: **Strict separation of financial rights (contacts) from public credits (artist_profiles)**.

## Tech Stack

- **Database**: Supabase (PostgreSQL 15+)
- **Backend**: Supabase PostgREST API + Edge Functions
- **Frontend**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth (magic links)
- **Storage**: Supabase Storage (contracts, cover art, master files)
- **Deployment**: Vercel (frontend) + Supabase Cloud

## Database Architecture (3-Pillar Model)

### Core Pillars

1. **contacts**: Legal/financial entities (sign contracts, receive payments)
2. **artist_profiles**: Public/brand entities (receive credits on DSPs)
3. **releases/tracks**: Commercial products

### Critical Schema Rules

- **Financial links**: licensor_shares → contact_id ONLY
- **Metadata links**: All credit tables → artist_profile_id ONLY
- **artist_profiles is master list**: ALL public names (major artists, producers, engineers)
- **artist_memberships**: Links artist brands to legal entities (solves group problem)
- **Ordering**: position field in release_main_artists, track_main_artists for "Artist 1 & Artist 2"
- **Inheritance**: inherited_from_release flag tracks "apply to all tracks" operations

### Key Tables

- contacts (legal_name, email, payout_info)
- artist_profiles (artist_name UNIQUE, spotify_url, apple_music_url)
- releases (title, version, type ENUM, status ENUM, internal_catalog_id)
- tracks (release_id FK CASCADE, title, version, isrc)
- artist_memberships (artist_profile_id, contact_id)
- release_main_artists (release_id, artist_profile_id, position)
- track_main_artists (track_id, artist_profile_id, position, inherited_from_release)
- release_contributors (release_id, artist_profile_id, role ENUM)
- track_contributors (track_id, artist_profile_id, role ENUM, inherited_from_release)
- contracts (contract_type ENUM, status ENUM, document_url)
- contract_signatories (contract_id, contact_id)
- contract_releases (contract_id, release_id)
- licensor_shares (track_id, contact_id, share_percent CHECK 0-100, UNIQUE per track)
- audit_log (table_name, record_id, action ENUM, old_data JSONB, new_data JSONB)

### Materialized View

- artist_search_index: Combines artist_profiles.artist_name + contacts.legal_name for dual search

## Current Implementation Status

### ✅ Completed (Phase 1 Week 1)

- PostgreSQL schema deployed to Supabase
- All ENUM types created
- Core tables with constraints
- Supabase project configured
- Next.js app initialized
- Supabase client connection tested
- Test data loaded (46 contacts)
- Basic data fetching working

### 🚧 In Progress

- RLS policies (currently disabled for development)
- Database functions (get_artist_display_line pending)

### 📋 Next Steps (Phase 1 Week 2)

- Implement get_artist_display_line() PostgreSQL function
- Create RLS policies for all tables
- Set up Supabase Storage buckets with policies
- Create validation functions (validate_track_shares)

## Code Conventions

### TypeScript

- Strict mode enabled
- Explicit return types on functions
- Use type definitions from Supabase (auto-generated)

### Components

- Server components by default (data fetching)
- Client components only when needed (forms, interactivity)
- Use 'use client' directive explicitly

### File Structure

```
app/
  (auth)/
    login/
  (dashboard)/
    releases/
    artists/
    contracts/
  test/
lib/
  supabase/
    client.ts
    server.ts
  types/
    database.types.ts (generated)
components/
  ui/ (shadcn)
  releases/
  artists/
```

### Supabase Patterns

- Use `export const dynamic = 'force-dynamic'` for server components fetching real-time data
- Prefer RPC functions for complex queries
- Use PostgREST select syntax: `.select('*, tracks(*), release_main_artists(*, artist_profiles(*))')`
- Always handle error cases from Supabase responses

### Naming

- Database: snake_case (PostgreSQL convention)
- TypeScript: camelCase for variables, PascalCase for components/types
- Files: kebab-case for components, lowercase for utilities

## Key Business Logic

### Artist Display Formatting

Function: get_artist_display_line(entity_type, entity_id)

- 1 artist: "Artist Name"
- 2 artists: "Artist 1 & Artist 2"
- 3+ artists: "Artist 1, Artist 2 & Artist 3"

### Share Validation

Before contract generation, validate: SUM(share_percent) = 100 per track
Constraint: UNIQUE(track_id, contact_id) prevents duplicate payees

### Inheritance Operations

"Apply to all tracks":

1. Create release_contributor entry
2. Batch insert track_contributors with inherited_from_release = true
   Override: Edit single track flips flag to false

### Search Pattern

Query artist_search_index to find artist_profiles by either artist_name OR linked contact legal_name
Example: Search "Dawda" OR "David Jassy" → same artist_profile

## Common Queries

### Fetch release with all relations

```typescript
const { data } = await supabase
  .from("releases")
  .select(
    `
    *,
    tracks(*),
    release_main_artists(
      position,
      artist_profiles(artist_name, spotify_url)
    ),
    release_contributors(
      role,
      artist_profiles(artist_name)
    )
  `
  )
  .eq("id", releaseId)
  .single();
```

### Validate track shares

```sql
SELECT COALESCE(SUM(share_percent), 0) = 100
FROM licensor_shares
WHERE track_id = $1;
```

## Development Notes

### Current Data

- 46 contacts loaded (real artist data)
- Artist profiles include: Dawda (David Jassy), Naarly, and others
- Test releases and tracks ready for development

### RLS Status

Currently disabled for development. Enable before production with policies:

- Artists see only releases they're credited on
- Admin role has full access
- Public can read artist_profiles for public site

### Known Issues

- artist_search_index needs periodic refresh (set up pg_cron)
- Contract PDF generation not yet implemented
- Email notifications pending

## Documentation References

- Schema: See `/docs/schema.md` (full SQL)
- Implementation plan: See `/docs/implementation-plan.md`
- API patterns: Supabase docs at docs.supabase.com

## Schema guardrails

- The canonical schema is defined in `/.claude/engeloop-records-final-data-model-schema.md`
- Do NOT:
  - add/remove tables,
  - rename columns,
  - or introduce new enums

unless explicitly instructed in a new message.

Safe modifications allowed for now:

1. Allow 0% in `licensor_shares.share_percent` by changing CHECK to `>= 0`.
2. Optionally add `label_share_percent` and `licensor_pool_percent` to `contracts` with a CHECK that they sum to 100.
3. Create helper functions and views (e.g. `generate_catalog_number`, `validate_release_shares`) that operate on this schema but do not change it.

All other complexity (clone workflows, autosave, variants, advanced validation) should be implemented **purely at the application level** using the existing schema.
