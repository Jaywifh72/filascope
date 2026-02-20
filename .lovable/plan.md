
## Admin Analytics Dashboard — Precise Gap Analysis & Enhancement Plan

### What Already Exists (Do Not Re-implement)

The `/admin/analytics` page is fully wired: route ✅, `AdminLayout` auth guard ✅, 6 tabs ✅. Here is a panel-by-panel audit:

**Tab 1: Affiliate Performance (`AffiliatePanel.tsx`)** — PARTIALLY DONE
- KPI cards: Today / Week / Month clicks + Unique Sessions ✅
- Clicks by Brand (horizontal bar chart) ✅
- Clicks by Region (pie chart) ✅
- Top Clicked Products table (10 rows) ✅
- Missing: **Clicks by store** (bar chart) — `affiliate_clicks_daily` has a `store` column
- Missing: **Clicks by material type** — `affiliate_clicks` has no material column, but `product_type` exists
- Missing: **Top 20 products** (currently limited to 10; need to expand to 20)
- Missing: **Click trend over time** (line/area chart by day)
- Missing: **90d / All Time** date range options (currently only Today / 7d / 30d)

**Tab 2: Content Metrics** — DOES NOT EXIST (no "Content Metrics" tab anywhere)
- Needs: product totals (8,297 total; 7,537 with price; 7,862 with image; 5,562 with TDS URL)
- Needs: products by material breakdown (chart)
- Needs: recently added products list
- Needs: deals count + discount distribution

**Tab 3: Search Analytics (`SearchPanel.tsx`)** — MOSTLY DONE ✅
- Top search terms ✅ (20 rows)
- Zero-result searches ✅
- Search volume trend (30-day area chart) ✅
- Missing: **Search → product view → affiliate click funnel** — requires correlating `search_logs.session_id` with `affiliate_clicks.session_id`

**Tab 4: SEO Health (`SeoHealthPanel.tsx`)** — PARTIAL
- robots.txt check ✅
- Sitemap configured ✅
- Prerender check ✅
- Hreflang badges ✅
- Indexable page counts (filaments + printers) ✅
- Missing: **Sitemap URL count by type** (currently shows total filament+printer count but not broken by type)
- Missing: **Pages with missing meta descriptions** — would need DB query
- Missing: **Pages with missing H1s** — needs DB query
- Note: Structured data validation is already covered by `SeoHealthPanel` + `SearchConsolePanel`

**Tab 5: Content Gaps (`ContentGapsPanel.tsx`)** — EXISTS under separate tab ✅

**Tab 6: Search Console (`SearchConsolePanel.tsx`)** — COMPREHENSIVE ✅

**Date Range** — The `AffiliatePanel` only supports Today/7d/30d. The user requests 7d/30d/90d/All Time.

---

### What Needs to Be Built

#### Priority 1 — Add `ContentMetricsPanel` (entirely new panel)

New file: `src/components/admin/analytics/ContentMetricsPanel.tsx`

Queries:
```typescript
// Product completeness
SELECT 
  COUNT(*) as total,
  COUNT(variant_price) as with_price,
  COUNT(featured_image) as with_image,
  COUNT(tds_url) as with_tds,
  COUNT(color_hex) as with_color,
  COUNT(transmission_distance) as with_td  -- only 3 rows but still shown
FROM filaments

// Material breakdown
SELECT material, COUNT(*) as count FROM filaments 
WHERE material IS NOT NULL GROUP BY material ORDER BY count DESC LIMIT 12

// Recently added
SELECT product_title, vendor, material, variant_price, created_at 
FROM filaments ORDER BY created_at DESC LIMIT 10

// Deals
SELECT COUNT(*) as deals, 
  AVG((variant_compare_at_price - variant_price) / variant_compare_at_price * 100) as avg_discount
FROM filaments 
WHERE variant_compare_at_price > variant_price AND variant_price > 0
```

Sections:
1. **5 KPI cards**: Total Products (8,297) / With Price (7,537 = 90.8%) / With Image (7,862 = 94.8%) / With TDS (5,562 = 67.0%) / Active Deals (914)
2. **Material breakdown** — horizontal bar chart (top 12 materials with counts)
3. **Recently Added Products** — table with product name, brand, material, price, date
4. **Deals & Discounts** — count + a small bar chart of discount brackets (10–20%, 20–30%, 30%+)

#### Priority 2 — Upgrade `AffiliatePanel` date range + missing charts

**File: `src/components/admin/analytics/AffiliatePanel.tsx`**

Changes:
1. **Date range**: Add `90d` and `all` options. Change `DateRange` type to `"today" | "7d" | "30d" | "90d" | "all"`. For `all`, use `startDate = "2020-01-01"`.

2. **Clicks by Store** — new bar chart querying `affiliate_clicks_daily.store`:
```typescript
const { data: storeData } = useQuery({
  queryKey: ["analytics-store-clicks", range],
  queryFn: async () => {
    const { data } = await supabase
      .from("affiliate_clicks_daily")
      .select("store, clicks")
      .gte("date", startDate);
    // aggregate by store, sort desc, top 10
  }
});
```

3. **Clicks by product_type** (material proxy) — from `affiliate_clicks.product_type`:
```typescript
.from("affiliate_clicks")
.select("product_type")
.gte("clicked_at", startDate)
// aggregate by product_type
```

4. **Click trend over time** — line chart using `useClicksByDay` hook (already exists! just needs to be rendered):
```typescript
const { data: clicksByDay } = useClicksByDay(filters);
// render as LineChart with date on X axis, sum of click_count on Y
```

5. **Top products expanded to 20** — change `.slice(0, 10)` to `.slice(0, 20)` and `.limit(500)` to `.limit(1000)`.

#### Priority 3 — Add Search Funnel to `SearchPanel`

**File: `src/components/admin/analytics/SearchPanel.tsx`**

Add a "Search → Click Funnel" section. Correlate `search_logs.session_id` with `affiliate_clicks.session_id`:
```typescript
// Sessions that searched (30d)
const searchSessions = new Set(searchLogs.map(r => r.session_id));
// Sessions that also clicked affiliate
const clickSessions = new Set(affiliateClicks.map(r => r.session_id));
// Overlap
const converted = [...searchSessions].filter(s => clickSessions.has(s)).length;
const conversionRate = searchSessions.size > 0 ? (converted / searchSessions.size * 100).toFixed(1) : 0;
```

Render as 3 funnel steps:
- Searches: N sessions
- Product Views: N/A (would need page view tracking — render as "—" placeholder)
- Affiliate Clicks: N sessions with rate %

#### Priority 4 — Add "Content" tab to the Analytics page

**File: `src/pages/admin/Analytics.tsx`**

Add a new `TabsTrigger value="content"` between "affiliate" and "search", and a matching `TabsContent`.

---

### Summary of Files to Change

| File | Change |
|---|---|
| `src/components/admin/analytics/ContentMetricsPanel.tsx` | **CREATE** — new content metrics tab |
| `src/components/admin/analytics/AffiliatePanel.tsx` | **EDIT** — add 90d/all range, store chart, material chart, trend chart, expand top products to 20 |
| `src/components/admin/analytics/SearchPanel.tsx` | **EDIT** — add search→click funnel section |
| `src/pages/admin/Analytics.tsx` | **EDIT** — add Content Metrics tab + import |

### No Database Changes Required

All data is already in the database. The `affiliate_clicks`, `affiliate_clicks_daily`, `filaments`, `search_logs`, and `search_zero_results` tables are all readable by authenticated admin users via existing RLS policies.

### No New Routes Required

`/admin/analytics` already exists, is lazy-loaded, and is behind `AdminLayout`'s auth guard.

### Data Notes from Live DB

From querying the actual database:
- Total filaments: **8,297**
- With price: **7,537** (90.8%)
- With image: **7,862** (94.8%)
- With TDS URL: **5,562** (67.0%)
- With TD (HueForge `transmission_distance`): **3** (shown as near-zero)
- Active deals: **914**
- Affiliate clicks in DB: **35** (still early, limited data for charts — handled with empty-state UI)
- Top materials: PLA (3,141), PETG (834), PLA+ (743), ABS (501), HTPLA (329)
