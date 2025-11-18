-- Create or replace helper to atomically create a release with catalog, artists, and default track (for singles)
create or replace function public.create_release_full(
  p_title text,
  p_type public.releases.type%TYPE,
  p_release_date date,
  p_artist_ids uuid[]
) returns table (release_id uuid, catalog_id text)
language plpgsql
as $$
declare
  v_catalog text;
  v_release_id uuid;
begin
  -- Generate catalog number
  v_catalog := public.generate_catalog_number(p_release_date, null);

  -- Insert release
  insert into public.releases (title, type, release_date, internal_catalog_id, status)
  values (p_title, p_type, p_release_date, v_catalog, 'planning')
  returning id into v_release_id;

  -- Insert main artists in order, if provided
  if array_length(p_artist_ids, 1) is not null then
    insert into public.release_main_artists (release_id, artist_profile_id, position)
    select v_release_id, p_artist_ids[i], i
    from generate_subscripts(p_artist_ids, 1) as s(i);
  end if;

  -- Insert default track for Singles
  if p_type = 'Single' then
    insert into public.tracks (release_id, title, position, explicit)
    values (v_release_id, p_title, 0, false);
  end if;

  release_id := v_release_id;
  catalog_id := v_catalog;
  return next;
end;
$$;
