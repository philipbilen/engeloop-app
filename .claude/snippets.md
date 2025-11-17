# Common Code Snippets

## Supabase Client (Server Component)

```typescript
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Fetch Release with Relations

```typescript
const { data: release, error } = await supabase
  .from("releases")
  .select(
    `
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
  `
  )
  .eq("id", releaseId)
  .single();
```

## Artist Search (via Materialized View)

```typescript
const { data: artists } = await supabase
  .from("artist_search_index")
  .select("*")
  .or(`artist_name.ilike.%${query}%,associated_legal_names.ilike.%${query}%`)
  .limit(10);
```

## Insert with Relations (Transaction Pattern)

```typescript
// Insert release
const { data: release } = await supabase
  .from("releases")
  .insert({
    title,
    type,
    status: "planning",
    internal_catalog_id,
  })
  .select()
  .single();

// Insert main artists with ordering
await supabase.from("release_main_artists").insert(
  selectedArtists.map((artist, index) => ({
    release_id: release.id,
    artist_profile_id: artist.id,
    position: index,
  }))
);
```

## RLS Policy Template (for later)

```sql
CREATE POLICY "policy_name" ON table_name
FOR SELECT
USING (
  -- condition that must be true
  auth.uid() IN (
    SELECT auth_id FROM artist_users WHERE contact_id = table_name.some_field
  )
);
```
