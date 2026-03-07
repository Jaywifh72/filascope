
-- Returns row counts and RLS status for all public tables (admin only)
CREATE OR REPLACE FUNCTION public.get_table_row_counts()
RETURNS TABLE (table_name text, row_count bigint, has_rls boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  cnt bigint;
  rls boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  FOR rec IN
    SELECT t.table_name AS tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', rec.tname) INTO cnt;

    SELECT pt.rowsecurity INTO rls
    FROM pg_tables pt
    WHERE pt.schemaname = 'public' AND pt.tablename = rec.tname;

    table_name := rec.tname;
    row_count := cnt;
    has_rls := COALESCE(rls, false);
    RETURN NEXT;
  END LOOP;
END;
$$;
