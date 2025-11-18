-- Ensure a single contributor entry per release/artist (aligns with upsert conflict target)
alter table public.release_contributors
  add constraint release_contributors_release_artist_key
  unique (release_id, artist_profile_id);
