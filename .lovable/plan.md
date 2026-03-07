

## Plan: Data Integrity Admin Page

### Overview
New admin page at `/admin/data-integrity` with 4 sections: Table Coverage Dashboard, Price Consistency Check, Orphan Detection, and Regional Coverage. All data fetched via direct Supabase queries using the authenticated admin client.

### Files

| File | Action |
|------|--------|
| `src/pages/admin/DataIntegrity.tsx` | New — main page with all 4 sections |
| `src/components/admin/AdminNewSidebar.tsx` | Edit — add nav entry in System group |
| `src/App.tsx` | Edit — add lazy import + route |

### Implementation

#### 1. Sidebar (`AdminNewSidebar.tsx`)
- Import `ShieldCheck` from lucide-react
- Add `{ title: 'Data Integrity', href: '/admin/data-integrity', icon: ShieldCheck }` to the System group items array

#### 2. Route (`App.tsx`)
- Add lazy import: `const AdminDataIntegrity = lazy(() => import("./pages/admin/DataIntegrity"));`
- Add route alongside other `AdminNewLayoutModule` routes: `<Route path="/admin/data-integrity" element={<AdminNewLayoutModule><AdminDataIntegrity /></AdminNewLayoutModule>} />`

#### 3. Page (`DataIntegrity.tsx`)

Uses `AdminPageHeader`, `Card`, `Table`, `Button`, `Badge` components. React Query for data fetching.

**Section 1 — Table Coverage Dashboard**
- One `useQuery` that runs 5 parallel count queries via `supabase.from('...').select('*', { count: 'exact', head: true })`:
  - `filaments`: total, with prices (`variant_price IS NOT NULL`), without any prices
  - `filament_listings`: total, count distinct filament_ids (use `.select('filament_id')` then dedupe client-side or a raw count)
  - `product_regional_prices`: total, distinct product_ids
  - `brand_sync_items`: total, count with status='imported'
  - `price_history`: total, min/max recorded_at
- Coverage percentage = listings unique filament_ids / filaments total
- Card grid (3 columns on desktop), each card shows count large + colored dot indicator

**Section 2 — Price Consistency Check**
- Button triggers a function that:
  1. Fetches 100 filaments that have `variant_price IS NOT NULL` via `.from('filaments').select('id, product_title, variant_price').not('variant_price', 'is', null).limit(100)`
  2. For those IDs, fetches matching listings: `.from('filament_listings').select('filament_id, current_price, region').in('filament_id', ids).eq('region', 'US')`
  3. Client-side joins and compares prices
  4. Shows results table + summary bar

**Section 3 — Orphan Detection**
- Runs 4 queries using left joins or NOT IN patterns:
  - Orphan listings: count listings where filament_id not in filaments (use RPC or fetch all listing filament_ids and compare)
  - Since we can't do subqueries easily with the JS client, we'll use a pragmatic approach: fetch counts via `.from('filament_listings').select('filament_id')` and `.from('filaments').select('id')`, then compute orphans client-side for reasonable sizes
  - For vendor mismatches: fetch distinct vendors from filaments, fetch brand_names from automated_brands, compare client-side
  - Display as simple stat cards

**Section 4 — Regional Coverage**
- For each region (US, CA, EU, UK, AU, JP), count:
  - Filaments with flat price column not null (e.g., `price_cad` for CA, `variant_price` for US)
  - Listings count per region: `.from('filament_listings').select('*', { count: 'exact', head: true }).eq('region', region)`
  - Regional prices count: `.from('product_regional_prices').select('*', { count: 'exact', head: true }).eq('region_code', region)`
  - Regional URLs: `.from('product_regional_urls').select('*', { count: 'exact', head: true }).eq('region_code', region)`
- Display as a table with regions as rows

### Styling
- Matches existing admin pages: `AdminPageHeader` with icon, `p-6 space-y-6` content area
- Cards use `Card/CardHeader/CardTitle/CardContent` from shadcn
- Color indicators: green (`text-green-500`), yellow (`text-yellow-500`), red (`text-red-500`) based on coverage thresholds
- Dark theme compatible via existing Tailwind classes

