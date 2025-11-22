-- Add contributor propagation and capture created track id for Singles
create or replace function public.create_release_full(
  p_title text,
  p_type public.releases.type%TYPE,
  p_release_date date,
  p_artist_ids uuid[] default '{}',
  p_contributors jsonb default '[]' -- [{artist_profile_id, role, role_custom}]
) returns table (release_id uuid, catalog_id text)
language plpgsql
as $$
declare
  v_catalog text;
  v_release_id uuid;
  v_track_id uuid;
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

  -- Insert default track and inherit artists/contributors for Singles
  if p_type = 'Single' then
    insert into public.tracks (release_id, title, position, explicit)
    values (v_release_id, p_title, 0, false)
    returning id into v_track_id;

    -- Inherit main artists onto the track
    if array_length(p_artist_ids, 1) is not null then
      insert into public.track_main_artists (track_id, artist_profile_id, position, inherited_from_release)
      select v_track_id, p_artist_ids[i], i, true
      from generate_subscripts(p_artist_ids, 1) as s(i);
    end if;

    -- Inherit contributors onto the track
    insert into public.track_contributors (track_id, artist_profile_id, role, role_custom, inherited_from_release)
    select
      v_track_id,
      contrib.artist_profile_id,
      contrib.role,
      contrib.role_custom,
      true
    from jsonb_to_recordset(p_contributors) as contrib(
      artist_profile_id uuid,
      role public.credit_role,
      role_custom text
    );
  end if;

  release_id := v_release_id;
  catalog_id := v_catalog;
  return next;
end;
$$;
