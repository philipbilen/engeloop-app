# Engeloop Records System Implementation Plan (Supabase Edition)

## Revised Tech Stack

**Database & Backend** Supabase (PostgreSQL 15+ with built-in features)

- PostgreSQL database (your schema runs natively)
- Auto-generated REST API (PostgREST)
- Real-time subscriptions (for collaborative editing)
- Row Level Security (RLS) for artist isolation
- Built-in auth
- Storage buckets (replaces S3)
- Edge Functions (Deno runtime for serverless)

**Frontend** Next.js 14+ with TypeScript

- Supabase JS client for queries
- Server components for initial data fetch
- Client components for interactive forms
- Tailwind CSS
- shadcn/ui (works great with Supabase patterns)

**Background Jobs** Supabase Edge Functions + pg_cron

- Contract PDF generation (Edge Function triggered via HTTP)
- Scheduled materialized view refresh (pg_cron built into Supabase)
- Email notifications (Supabase has built-in email)

**PDF Generation** Edge Function with pdf-lib or Puppeteer

- Or keep LaTeX: Edge Function calls external service (LaTeX.Online API)
- Store generated PDFs in Supabase Storage

**Authentication** Supabase Auth (built-in)

- Magic links out of the box
- Social providers if needed later
- JWT tokens automatically managed

**Deployment** Vercel (Next.js) + Supabase Cloud

- Zero-config Next.js deployment
- Supabase handles database, auth, storage, functions
- Environment variables via Vercel dashboard

## Key Supabase Advantages for Your Use Case

**Schema-first workflow** You already have SQL schema—paste directly into Supabase SQL editor. No ORM translation layer.

**Automatic API** PostgREST generates REST endpoints from your schema. GET `/rest/v1/releases?select=*,tracks(*)` automatically joins relations. No Express routes to write.

**RLS for multi-tenancy** Artists only see their own releases:

```sql
CREATE POLICY artist_releases ON releases
FOR SELECT USING (
  id IN (
    SELECT r.id FROM releases r
    JOIN release_main_artists rma ON r.id = rma.release_id
    JOIN artist_memberships am ON rma.artist_profile_id = am.artist_profile_id
    WHERE am.contact_id IN (
      SELECT contact_id FROM artist_users WHERE auth_id = auth.uid()
    )
  )
);
```

**Built-in storage** Upload cover art, master files, contracts to Supabase Storage. Signed URLs built-in. No S3 configuration.

**Real-time** Artists can see release status updates live without polling:

```typescript
supabase
  .channel("release-updates")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "releases",
    },
    (payload) => {
      // Update UI immediately
    }
  )
  .subscribe();
```

## Revised Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Supabase Project Setup**

1. Create Supabase project at dashboard.supabase.com
2. In SQL Editor, run your complete schema:
   - All CREATE TYPE statements (ENUMs)
   - All CREATE TABLE statements
   - Indexes: `CREATE INDEX idx_releases_status ON releases(status);`
   - Materialized view: `artist_search_index`
3. Set up scheduled refresh for materialized view:

```sql
SELECT cron.schedule(
  'refresh-artist-search',
  '0 * * * *', -- every hour
  $$REFRESH MATERIALIZED VIEW artist_search_index$$
);
```

4. Create audit log triggers (Supabase has trigger examples in docs)
5. Enable RLS on all tables: `ALTER TABLE releases ENABLE ROW LEVEL SECURITY;`
6. Create artist_users table linking contacts to Supabase auth:

```sql
CREATE TABLE artist_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  UNIQUE(auth_id)
);
```

7. Seed database via SQL Editor: insert test contacts, artist_profiles, releases
8. Test PostgREST API via Supabase dashboard API docs

**Week 2: Function & Policy Setup**

1. Implement `get_artist_display_line()` PostgreSQL function
2. Create RLS policies for each table:
   - Admin role: full access (set via custom claims)
   - Artist role: scoped to their linked releases/tracks
   - Public: read-only artist_profiles for public site
3. Create database function for share validation:

```sql
CREATE FUNCTION validate_track_shares(track_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(SUM(share_percent), 0) = 100
  FROM licensor_shares
  WHERE track_id = track_uuid;
$$ LANGUAGE SQL;
```

4. Set up Supabase Storage buckets:
   - `cover-art` (public)
   - `master-files` (private, artist-scoped)
   - `contracts` (private, admin-only)
5. Create storage policies (artists can upload to their own releases)
6. Initialize Next.js project locally with `create-next-app`
7. Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`
8. Configure environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Phase 2: Artist Interface (Weeks 3-4)

**Week 3: Authentication & Dashboard Shell**

1. Create Supabase client utilities:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

2. Build auth pages:
   - `/login` with magic link form (calls `supabase.auth.signInWithOtp`)
   - `/auth/callback` to handle email link verification
3. Create auth middleware protecting artist routes
4. Build dashboard layout with sidebar navigation
5. Create releases list page:

```typescript
const { data: releases } = await supabase
  .from("releases")
  .select(
    `
    *,
    release_main_artists(
      position,
      artist_profiles(artist_name)
    )
  `
  )
  .order("created_at", { ascending: false });
```

6. Build release status filter (dropdown calling RLS-protected queries)
7. Add real-time subscription for release updates

**Week 4: Release Submission Form**

1. Build multi-step form component (same structure as original plan)
2. Artist search autocomplete:

```typescript
const { data: artists } = await supabase.rpc("search_artists", {
  search_term: query,
});
```

(This RPC queries `artist_search_index`) 3. Implement form state management (React Hook Form or Zustand) 4. Handle file uploads for cover art:

```typescript
const { data, error } = await supabase.storage
  .from("cover-art")
  .upload(`${releaseId}/cover.jpg`, file);
```

5. Submit form with transaction pattern:

```typescript
const { data: release } = await supabase
  .from('releases')
  .insert({ title, type, status: 'planning' })
  .select()
  .single()

await supabase
  .from('release_main_artists')
  .insert(mainArtists.map((a, i) => ({
    release_id: release.id,
    artist_profile_id: a.id,
    position: i
  })))

await supabase
  .from('tracks')
  .insert(tracks.map(t => ({
    release_id: release.id,
    …t
  })))
```

6. Add optimistic UI updates
7. Build release detail page with edit mode

### Phase 3: Financial & Legal (Weeks 5-6)

**Week 5: Schedule A Management**

1. Create licensor shares editor component
2. Build real-time validation display:

```typescript
const { data: shares } = await supabase
  .from("licensor_shares")
  .select("*, contacts(legal_name)")
  .eq("track_id", trackId);

const isValid = await supabase.rpc("validate_track_shares", {
  track_uuid: trackId,
});
```

3. Implement add/remove share rows with immediate validation
4. Build "Copy shares to all tracks" feature (batch insert)
5. Create financial dashboard aggregating shares by contact:

```typescript
const { data } = await supabase
  .from("licensor_shares")
  .select("contact_id, contacts(legal_name), share_percent, tracks(title)");
```

6. Add CSV export using client-side library (papaparse)

**Week 6: Contract Generation**

1. Create Supabase Edge Function for PDF generation:

```typescript
// supabase/functions/generate-contract/index.ts
import { serve } from "std/server";

serve(async (req) => {
  const { contractId } = await req.json();

  // Fetch contract data via Supabase client
  // Generate PDF (pdf-lib or call LaTeX service)
  // Upload to storage
  // Update contracts table

  return new Response(JSON.stringify({ success: true }));
});
```

2. Deploy Edge Function: `supabase functions deploy generate-contract`
3. Build contracts list page with filters
4. Create contract detail page with PDF viewer (Supabase Storage signed URL)
5. Build contract creation form
6. Add "Generate PDF" button invoking Edge Function:

```typescript
const { data } = await supabase.functions.invoke("generate-contract", {
  body: { contractId },
});
```

7. Set up email notifications when contract ready (Supabase Auth can send custom emails)

### Phase 4: Advanced Features (Weeks 7-8)

**Week 7: Inheritance & Bulk Operations**

1. Create Edge Function for "Apply to all tracks":

```typescript
// Prevents hitting RLS issues with complex operations
serve(async (req) => {
  const { releaseId, contributorData } = await req.json();

  // Insert release_contributor
  // Fetch all track IDs for release
  // Batch insert track_contributors with inherited_from_release = true

  return new Response(JSON.stringify({ count: inserted.length }));
});
```

2. Build UI for inheritance visualization (badge component)
3. Implement override functionality (updates single track, flips flag)
4. Create audit log viewer querying `audit_log` table
5. Add real-time updates for collaborative editing (multiple admins)

**Week 8: Search & Reporting**

1. Build global search using Supabase full-text search:

```sql
CREATE INDEX releases_title_search ON releases
USING gin(to_tsvector('english', title));
```

2. Create catalog reporting dashboard:

```typescript
const { data: statusCounts } = await supabase
  .from("releases")
  .select("status, count")
  .group("status");
```

3. Build chart components (recharts or visx)
4. Implement filtered exports
5. Create artist profile management page (edit bio, photos, links)
6. Build artist membership editor
7. Add webhook for release status changes triggering email notifications

### Phase 5: Polish & Deployment (Weeks 9-10)

**Week 9: Testing & Optimization**

1. Write integration tests using Supabase local development:

```bash
supabase start # Runs local PostgreSQL with your migrations
npx playwright test # E2E tests against local Supabase
```

2. Add database indexes for common queries (check via pgAdmin query analyzer)
3. Optimize RLS policies (add indexes on columns used in policies)
4. Implement proper error handling for Supabase errors
5. Add loading skeletons and suspense boundaries
6. Test RLS thoroughly: ensure artists can't see others' data

**Week 10: Production Deployment**

1. Deploy Next.js to Vercel:

```bash
vercel --prod
```

2. Connect Vercel to Supabase project (environment variables auto-configured)
3. Run migrations on Supabase production database via dashboard
4. Seed production with initial data (contacts, artist_profiles)
5. Configure custom domain for Supabase project (optional)
6. Set up Supabase database backups (Point-in-Time Recovery enabled by default)
7. Create admin user with custom claims:

```sql
INSERT INTO artist_users (auth_id, contact_id) VALUES (…);
-- Set custom claim via Supabase dashboard or function
```

8. Deploy all Edge Functions to production
9. Test contract generation pipeline end-to-end
10. Create documentation in Notion/Obsidian
11. Set up monitoring: Supabase has built-in logs, add Sentry for Next.js

## Supabase-Specific Optimizations

**Use RPC for complex queries** Instead of fetching relations and computing in JS, create PostgreSQL functions:

```sql
CREATE FUNCTION get_release_with_formatted_artists(release_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', r.id,
    'title', r.title,
    'artists', get_artist_display_line('release', r.id)
  )
  FROM releases r WHERE r.id = release_uuid;
$$ LANGUAGE SQL;
```

**Leverage real-time for UX** When admin updates release status, artist sees change instantly without refresh.

**Use storage transformations** Supabase Storage can resize images on-the-fly:

```typescript
const url = supabase.storage
  .from("cover-art")
  .getPublicUrl("release/cover.jpg", {
    transform: { width: 300, height: 300 },
  });
```

**Database webhooks** Trigger external services (Slack notifications, analytics) via Supabase webhooks on table events.

## Timeline Adjustment

**Aggressive (Supabase shortcuts): 8 weeks** **Realistic: 12-14 weeks** **Conservative: 18-20 weeks**

Supabase eliminates 2-3 weeks compared to custom backend:

- No Express API to build (PostgREST auto-generated)
- No auth system to implement (built-in)
- No S3 configuration (Storage built-in)
- No Redis setup for jobs (Edge Functions + pg_cron)

Start with Phase 1 Week 1 today. Create Supabase project, paste your schema, see data immediately via auto-generated API.
