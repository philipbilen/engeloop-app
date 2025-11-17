# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Engeloop Records is an independent electronic music label management system built on Supabase + Next.js. The system manages release workflows, artist onboarding, contract generation, and metadata coordination with a core focus on **strict separation of financial rights (contacts) from public credits (artist_profiles)**.

Primary music focus: Afro House releases, expanding to other genres.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Environment setup
cp .env.example .env.local
# Edit .env.local with Supabase credentials
```

## Database Architecture: The 3-Pillar Model

This is the most critical aspect of the system to understand. The schema enforces a strict separation between three core entity types:

### Core Pillars

1. **`contacts`** - Legal/financial entities who sign contracts and receive payments
2. **`artist_profiles`** - Public/brand entities that receive credits on streaming platforms
3. **`releases`/`tracks`** - Commercial products being sold

### Critical Schema Rules

**Financial Links (Schedule A payouts):**
- `licensor_shares` → links to `contact_id` ONLY
- Never link financial data to `artist_profile_id`

**Metadata Links (DSP credits):**
- `release_main_artists`, `track_main_artists`, `release_contributors`, `track_contributors`
- All credit tables → link to `artist_profile_id` ONLY
- Never link credits to `contact_id`

**artist_profiles is the Master List:**
- Single source of truth for ALL public-facing names
- Includes major artists, producers, remixers, engineers
- Search this table when adding any public credit
- NO `display_name` text fields allowed (prevents data corruption)

**Solving the Group Problem:**
- `artist_memberships` junction table links one `artist_profile_id` to multiple `contact_id`s
- Example: "Swedish House Mafia" (artist_profile) → 3 individual members (contacts)

**Ordered Credits:**
- `position` field in main artist tables enables "Artist 1 & Artist 2" formatting
- Lower position value = earlier in display order

**Inheritance Pattern:**
- `inherited_from_release` boolean flag tracks credits applied to all tracks
- When editing a single track, flip flag to `false` to override

### Key Tables Reference

```
contacts (legal_name, email, payout_info)
artist_profiles (artist_name UNIQUE, spotify_url, apple_music_url)
artist_memberships (artist_profile_id, contact_id)
releases (title, version, type ENUM, status ENUM, internal_catalog_id)
tracks (release_id FK CASCADE, title, version, isrc)
release_main_artists (release_id, artist_profile_id, position)
track_main_artists (track_id, artist_profile_id, position, inherited_from_release)
release_contributors (release_id, artist_profile_id, role ENUM)
track_contributors (track_id, artist_profile_id, role ENUM, inherited_from_release)
contracts (contract_type ENUM, status ENUM, document_url)
contract_signatories (contract_id, contact_id)
contract_releases (contract_id, release_id)
licensor_shares (track_id, contact_id, share_percent CHECK 0-100)
audit_log (table_name, record_id, action ENUM, old_data JSONB, new_data JSONB)
```

### Materialized View

`artist_search_index` - Combines `artist_profiles.artist_name` + `contacts.legal_name` for unified search. Allows searching "Dawda" OR "David Jassy" to resolve to the same artist profile.

## Supabase Integration Patterns

### Database Client (Server Components)

```typescript
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Querying with Relations

Use PostgREST select syntax to fetch nested relations:

```typescript
const { data: release, error } = await supabase
  .from("releases")
  .select(`
    *,
    tracks(
      *,
      track_main_artists(
        position,
        artist_profiles(artist_name)
      )
    ),
    release_main_artists(
      position,
      artist_profiles(artist_name, spotify_url)
    )
  `)
  .eq("id", releaseId)
  .single();
```

### Share Validation

Before contract generation, validate: `SUM(share_percent) = 100` per track

```sql
SELECT COALESCE(SUM(share_percent), 0) = 100
FROM licensor_shares
WHERE track_id = $1;
```

## Business Logic Functions

### Artist Display Formatting

Implemented via PostgreSQL function: `get_artist_display_line(entity_type, entity_id)`

- 1 artist: "Artist Name"
- 2 artists: "Artist 1 & Artist 2"
- 3+ artists: "Artist 1, Artist 2 & Artist 3"

Uses the `position` field to determine ordering.

### Inheritance Operations ("Apply to all tracks")

1. Create `release_contributor` entry
2. Batch insert `track_contributors` with `inherited_from_release = true`
3. To override on single track: edit that track and flip flag to `false`

## Code Conventions

### TypeScript Standards

- Strict mode enabled
- Explicit return types on functions
- Use type definitions from Supabase (auto-generated if available)

### Next.js App Router Patterns

- Server components by default (for data fetching)
- Client components only when needed (forms, interactivity)
- Use `'use client'` directive explicitly
- Use `export const dynamic = 'force-dynamic'` for real-time data fetching in server components

### File Naming

- Components: kebab-case (e.g., `artist-selector.tsx`)
- Utilities: lowercase (e.g., `supabase.ts`)
- Database: snake_case (PostgreSQL convention)
- TypeScript: camelCase for variables, PascalCase for components/types

### Project Structure

```
engeloop-app/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth-related routes
│   │   └── login/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── releases/
│   │   ├── artists/
│   │   └── contracts/
│   └── test/              # Development test pages
├── lib/                   # Utilities and Supabase clients
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── types/
│       └── database.types.ts
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── releases/
│   └── artists/
├── docs/                 # Technical documentation
│   ├── schema.md         # Full SQL schema
│   └── implementation-plan.md
└── .claude/              # Claude Code context
    ├── project-context.md
    ├── preferences.md
    └── snippets.md
```

## Development Guidelines

### DO

- Check exact table/column names in `.claude/project-context.md` before writing queries
- Use Supabase PostgREST joins instead of creating API routes
- Implement proper error handling (not just console.log)
- Add loading states for better UX
- Use Tailwind classes (avoid inline styles)
- Consider RLS implications even if currently disabled
- Validate financial data (shares sum to 100%)
- Think about the `inherited_from_release` flag when working with credits
- Always handle Supabase error responses

### DO NOT

- Use Prisma or any ORM (direct Supabase client only)
- Create Next.js API routes (PostgREST handles this)
- Use `useState` for server-fetched data (prefer server components)
- Mutate data without considering `audit_log` implications
- Mix `contact_id` and `artist_profile_id` incorrectly
- Add `display_name` text fields (breaks single source of truth)
- Use the `pages/` directory (App Router only)

## Current Implementation Status

### Completed (Phase 1 Week 1)

- PostgreSQL schema deployed to Supabase
- All ENUM types created
- Core tables with constraints
- Supabase project configured
- Next.js app initialized with TypeScript
- Supabase client connection tested
- Test data loaded (46 contacts)

### In Progress (Phase 1 Week 2)

- RLS policies (currently disabled for development)
- Database functions (get_artist_display_line pending)
- Supabase Storage buckets setup
- Validation functions (validate_track_shares)

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Additional Documentation

- Full schema: [docs/schema.md](docs/schema.md)
- Implementation plan: [docs/implementation-plan.md](docs/implementation-plan.md)
- Project context: [.claude/project-context.md](.claude/project-context.md)
- Code preferences: [.claude/preferences.md](.claude/preferences.md)
- Common snippets: [.claude/snippets.md](.claude/snippets.md)

## Known Issues & Future Work

- `artist_search_index` materialized view needs periodic refresh (pg_cron setup pending)
- RLS policies need to be enabled before production
- Contract PDF generation not yet implemented
- Email notifications pending
