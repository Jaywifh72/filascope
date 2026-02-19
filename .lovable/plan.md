
# Admin Analytics Dashboard — Implementation Plan

## Current State Analysis

**Routing Architecture:**
- `/admin` → `NewAdminPanel.tsx` (modern panel with feature flags + sync monitor)
- `/admin/affiliate-hub` → `AdminAffiliateHub.tsx` (existing, already registered in `App.tsx`)
- `/admin/pricing-data` → `PricingData.tsx` (already registered in `App.tsx`)
- `/admin/*` → catches all other `/admin/` routes and redirects to `/old-admin/` equivalents
- The plan: register `/admin/analytics` **before** the wildcard catch-all at line 256 of `App.tsx`

**Existing Infrastructure (reuse, don't duplicate):**
- `useAffiliateClickAnalytics.ts` — already has `useClickSummary`, `useClicksByDay`, `useRecentClicks`, `useDistinctBrandNames`, `useClicksToday`
- `affiliate_clicks_daily` view — exists with columns: `date, brand, store, region, clicks, unique_sessions, unique_products, avg_price`
- `search_zero_results` view — exists with: `search_term, search_count, unique_sessions, last_searched_at, most_common_region`
- `AdminLayout` — used by many admin pages, wraps with sidebar and auth gate
- `AdminPageHeader` — standard header component
- Recharts — already installed and used in `AdminModuleAnalytics.tsx`

**Live Data Confirmed:**
- `affiliate_clicks`: 35 rows, brands: Creality (17), Anycubic (14), eSUN (3), Overture (1)
- Regions: US (21), CA (13), UK (1)
- `search_logs`: 0 rows currently (but schema is correct and ready)
- GA4 Measurement ID: `G-Q96R53VCKM` (hardcoded in `src/lib/analytics.ts`)

**GA4 Data API Decision:**
The GA4 Data API requires a service account JSON key as a secret + an edge function to proxy requests. This is doable but complex. Instead, we will embed the GA4 Looker Studio report link + provide a direct GA4 link to Google Analytics — this keeps the dashboard focused and avoids secret management complexity. The user explicitly offered this as an option.

**Admin `/admin/analytics` Route:**
The wildcard `<Route path="/admin/*" element={<AdminRedirect />} />` at line 256 of `App.tsx` will catch `/admin/analytics` and redirect it. We must add the new route **before** that wildcard, like `/admin/affiliate-hub` and `/admin/pricing-data` are already registered.

---

## New Files to Create

### 1. `src/pages/admin/Analytics.tsx` — Main dashboard page

The page is organized into 5 tabbed panels using the existing `Tabs` component pattern. It uses `AdminLayout` for auth protection + sidebar.

**Tab structure:**
- **Affiliate** (default) — affiliate performance charts
- **Search** — search insights
- **Traffic** — GA4 links + embeds
- **SEO Health** — status indicators
- **Content Gaps** — zero-result searches + low-CTR brands

### 2. `src/components/admin/analytics/AffiliatePanel.tsx`

Affiliate Performance Panel:
- **KPI row** (4 cards): Clicks Today / This Week / This Month / Unique Sessions
- **Clicks by Brand** — horizontal `BarChart` (Recharts), using `affiliate_clicks_daily` view aggregated by brand
- **Clicks by Region** — `PieChart` with region breakdown
- **Top Source Components** — small table of `source_component` vs click count
- **Top Clicked Products** — table of `product_name, brand_name, clicks, sessions` with link to `/filament/${product_slug}`

Data queries:
- Uses existing `useClickSummary` hook (date-range filtered)
- New inline query for brand aggregation from `affiliate_clicks_daily`
- New inline query for region from `affiliate_clicks` grouped by `region_code`
- New inline query for top products from `affiliate_clicks` grouped by `product_name, brand_name`

Date range selector: Today / 7 days / 30 days (drives all queries)

### 3. `src/components/admin/analytics/SearchPanel.tsx`

Search Insights Panel:
- **Top Search Terms** table: `search_term, searches, zero_results_count, last_seen` — from `search_logs` grouped by `search_term`
- **Zero-Result Searches** table: from `search_zero_results` view with `search_count, unique_sessions, last_searched_at`
- **Search Volume Trend** — `AreaChart` of daily searches over 30 days
- Empty state: "No search data yet — searches will appear here as users interact with the site."

### 4. `src/components/admin/analytics/TrafficPanel.tsx`

Traffic Overview Panel (GA4):
- **Explanation card**: "Traffic data is powered by Google Analytics 4. View detailed reports in GA4 directly or via Looker Studio."
- **Quick Links grid**: 4 cards linking to GA4 dashboard, GA4 Audience report, GA4 Pages report, Looker Studio (user can paste their own embed URL)
- **Looker Studio embed slot**: An `<iframe>` placeholder that the user can configure with their Looker Studio report URL — stored in `localStorage` so they can paste it in. Includes an edit button to enter the URL.
- **Fallback**: A clean information panel explaining what GA4 tracks and linking directly to `https://analytics.google.com`

### 5. `src/components/admin/analytics/SeoHealthPanel.tsx`

SEO Health Panel:
- **Status indicators grid** (using colored badges):
  - robots.txt reachable → fetches `/robots.txt` client-side, shows ✓ or ✗
  - Sitemap URL → links to `https://filascope.com/sitemap.xml`
  - Prerender active → checks for `X-Prerender: true` header by fetching a test URL
- **External tools links**: Google Search Console, Bing Webmaster Tools
- **Site page count**: Query `filaments` count + `printers` count + guides count as total indexable pages estimate
- **Hreflang status**: Shows the 7 supported locale tags

### 6. `src/components/admin/analytics/ContentGapsPanel.tsx`

Content Gaps Panel:
- **Zero-Result Searches** — ranked table from `search_zero_results` view: `search_term, search_count, unique_sessions` — sorted by frequency. Each row has a "Create Guide" link hint.
- **Brands with High Views, Low Clicks** — query `affiliate_clicks` to find brands with low click-through rates vs page view counts (using `source_page` frequency as a proxy for views)
- **Most Viewed Source Pages with No Clicks** — from `affiliate_clicks`, group by `source_page` to find high-traffic pages where clicks happen vs pages with 0 recorded clicks

---

## Files to Modify

### 1. `src/App.tsx`
Add the new route before the wildcard:
```
<Route path="/admin/analytics" element={<AdminAnalytics />} />
```
Add the lazy import:
```
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
```

### 2. `src/pages/NewAdminPanel.tsx`
Add a "Analytics Dashboard" quick link card alongside the Affiliate Hub and Pricing Data cards, pointing to `/admin/analytics`.

---

## Data Query Strategy

All panels use `@tanstack/react-query` hooks for caching. Queries that don't exist yet will be written inline within the panel components (no new hook files needed — the data is dashboard-specific).

Key queries by panel:

**Affiliate Panel:**
```typescript
// Brand clicks aggregation
supabase.from('affiliate_clicks_daily')
  .select('brand, clicks, date')
  .gte('date', startDate)
  .order('date', { ascending: true })

// Region breakdown
supabase.from('affiliate_clicks')
  .select('region_code')
  .gte('clicked_at', startDate)
  // → group client-side by region_code

// Top products
supabase.from('affiliate_clicks')
  .select('product_name, brand_name, product_slug, session_id')
  .gte('clicked_at', startDate)
  .not('product_name', 'is', null)
  .order('clicked_at', { ascending: false })
  .limit(500)
  // → group client-side by product_name
```

**Search Panel:**
```typescript
// Top terms (from search_logs table)
supabase.from('search_logs')
  .select('search_term, results_count, created_at')
  .gte('created_at', last30Days)
  .order('created_at', { ascending: false })
  .limit(1000)
  // → group client-side by search_term

// Zero-result view
supabase.from('search_zero_results')
  .select('*')
  .order('search_count', { ascending: false })
  .limit(50)
```

---

## Component Architecture

```text
src/pages/admin/Analytics.tsx
  └─ AdminLayout (auth gate + sidebar)
     └─ AdminPageHeader (title, date range selector)
        └─ Tabs
           ├─ AffiliatePanel.tsx
           │   ├─ KPI cards row
           │   ├─ BarChart (brands)
           │   ├─ PieChart (regions)
           │   └─ Tables (top products, source components)
           ├─ SearchPanel.tsx
           │   ├─ AreaChart (volume trend)
           │   ├─ Table (top terms)
           │   └─ Table (zero-result terms)
           ├─ TrafficPanel.tsx
           │   ├─ GA4 external links grid
           │   └─ Looker Studio iframe slot (configurable)
           ├─ SeoHealthPanel.tsx
           │   ├─ Status checks (robots.txt, sitemap, prerender)
           │   └─ External tool links
           └─ ContentGapsPanel.tsx
               ├─ Zero-result searches ranked table
               └─ Brands low-CTR table
```

---

## Technical Considerations

- **Auth**: `AdminLayout` handles all auth protection — no extra guards needed in the analytics page
- **No new DB schema needed**: All required tables and views already exist
- **GA4 integration**: Linking out (not embedding) to avoid service account complexity; Looker Studio URL stored in `localStorage` for easy configuration
- **Chart colors**: Match existing admin chart palette (orange, blue, green, purple) from `AdminModuleAnalytics.tsx`
- **Empty states**: All panels have graceful empty states since `search_logs` currently has 0 rows
- **Date ranges**: Global date range selector on the page drives all Supabase panels; GA4/SEO panels are static links so they're unaffected
- **Recharts**: Already installed — reuse `BarChart`, `PieChart`, `AreaChart`, `ResponsiveContainer` from the existing pattern in `AdminModuleAnalytics.tsx`
- **Sidebar**: No changes needed to `AdminSidebar` since it points to `/old-admin/*` routes; the new page is accessed via `NewAdminPanel.tsx` quick link and direct URL navigation
