---
trigger: always_on
---

# Product Context: Engeloop Records Manager

## Mission

We are building a high-density, industrial-grade catalog and rights manager for **Engeloop Records** (independent electronic / Afro House label). This tool manages:

- Metadata (releases, tracks, credits)
- Legal contracts (licences, distribution)
- Financial splits and royalty logic

## The "3-Pillar" Data Model (CRITICAL)

The database strictly separates three entity types. NEVER mix or shortcut these.

### 1. Contacts (`contacts`)

Legal / financial entities:

- Real humans or companies
- Have legal names, tax status, and payout details
- Sign contracts and receive money

Use `contacts` for:

- Licensor / royalty splits
- Agreement parties
- Anything involving invoices, VAT, or payouts

### 2. Artist Profiles (`artist_profiles`)

Public-facing brands:

- Examples: “Naarly”, “Swedish House Mafia”
- Have DSP profile URLs (Spotify, Apple Music, etc.)
- Appear in public credits and artwork
- Do **not** sign contracts or receive money directly

Use `artist_profiles` for:

- Display credits on tracks and releases
- Building artist display lines
- Linking to Spotify / Apple artist pages

### 3. Releases / Tracks (`releases`, `tracks`)

Commercial assets:

- `releases`: products with UPCs (singles, EPs, albums)
- `tracks`: individual recordings with ISRCs belonging to a release

Use `releases` / `tracks` for:

- Release scheduling and statuses
- Track ordering and versions
- Linking masters to compositions and credits

### Routing Checklist (When In Doubt)

If the user asks about:

- **Who gets paid or signs** → use `contacts`.
- **Who is shown as artist on DSPs** → use `artist_profiles`.
- **Which product / recording** → use `releases` and `tracks`.

If information cuts across pillars, keep the links explicit; never store the same concept in more than one pillar.

## Operational Rules

These rules are hard constraints.

### Financials

- `licensor_shares` MUST ONLY link to `contacts`.
- Never attach money, royalty %, or payout details to an `artist_profile`.
- All royalty math starts from `contacts` and contract terms, then flows down to tracks and releases.

### Credits

- `track_main_artists` and `contributors` MUST ONLY link to `artist_profiles`.
- Display artist lines are derived from ordered `track_main_artists` rows, not typed free text.
- Non-display roles (Producer, Mixer, Mastering Engineer, Composer, Lyricist, etc.) are stored as contributor rows keyed by `artist_profiles`.

### Groups and Memberships

- Groups (band / project names) are represented as `artist_profiles`.
- Individual humans remain `contacts`.
- Membership relationships are stored in `artist_memberships`:
  - `artist_profile_id` = group
  - `contact_id` = human member
- Use this link whenever you need to “see which humans are behind a brand”.

### Source of Truth

- `artist_profiles` is the **only** source of truth for public credits.
- Do not invent or store ad-hoc artist name strings in other tables.
- `contacts` is the single source of truth for legal names and financial rights.

### Common Mistakes To Avoid

- Mistake: Linking `licensor_shares` to `artist_profiles`.
  - Correct: Always link licensor shares to `contacts`.
- Mistake: Using a free-text field to store “Artist Name” on releases.
  - Correct: Always derive display lines from ordered `track_main_artists` → `artist_profiles`.
- Mistake: Copying one entity into multiple pillars (e.g. duplicating a person as both contact and artist profile without a clear mapping).
  - Correct: Keep the separation strict and link pillars through junction tables.