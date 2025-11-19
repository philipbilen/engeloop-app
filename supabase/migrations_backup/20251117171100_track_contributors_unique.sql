-- Enforce uniqueness per track/artist/role to support upserts
alter table public.track_contributors
  add constraint track_contributors_track_artist_role_key
  unique (track_id, artist_profile_id, role);
