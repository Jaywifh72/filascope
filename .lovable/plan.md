

## Plan: Table Usage Audit System

### Step 1: Database Migration — `get_table_row_counts` RPC

Create a SECURITY DEFINER function that:
- Loops through `information_schema.tables` (schema = 'public', type = 'BASE TABLE')
- For each table, runs `EXECUTE format('SELECT count(*) FROM public.%I', ...)` to get row count
- Checks RLS status via `pg_tables.rowsecurity`
- Gates access with `has_role(auth.uid(), 'admin')`
- Returns `TABLE (table_name text, row_count bigint, has_rls boolean)`

### Step 2: New Component — `TableUsageAudit.tsx`

Location: `src/components/admin/data-integrity/TableUsageAudit.tsx`

- Calls `supabase.rpc('get_table_row_counts')` via React Query (staleTime 5min)
- Summary bar: "X active tables, Y empty, Z without RLS"
- Filter toggles: All / Empty only / No RLS only (using Button group or toggle buttons)
- Sortable table (click column headers to sort by name, count, RLS, status):
  - Table Name
  - Row Count (formatted with `.toLocaleString()`)
  - Has RLS (Yes/No badge)
  - Status badge: Empty (gray) / No RLS! (red/destructive) / Active (green)
- Uses existing Table, Badge, Button components from shadcn

### Step 3: Add to `DataIntegrity.tsx`

- Import `TableUsageAudit`
- Add as a new section at the end (after Affiliate Config Audit), using the existing `SectionHeader` pattern
- No changes to existing sections

### Files to create/edit:
1. New migration SQL file
2. New: `src/components/admin/data-integrity/TableUsageAudit.tsx`
3. Edit: `src/pages/admin/DataIntegrity.tsx` (add import + section)

