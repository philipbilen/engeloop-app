-- Disable RLS on track_main_artists to align with other tables (dev-only)
ALTER TABLE public.track_main_artists DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.track_main_artists IS 'RLS disabled for development (admin-only usage)';
