
## Analytics Dashboard — What Exists vs. What Needs Building

### Current State (Already Implemented)
The dashboard at `/admin/analytics` already has **7 tabs** with substantial functionality:

| Tab | Status |
|---|---|
| **Affiliate Performance** | ✅ Full — KPIs, trend chart, brands, regions, stores, material type, top 20 products |
| **Content Metrics** | ✅ Full — completeness KPIs, material breakdown, deals distribution, recently added |
| **Search Insights** | ✅ Full — volume trend, funnel, top terms, zero-result table |
| **Traffic (GA4)** | ✅ Exists — links to GA4 and Looker Studio embed; no native data pull |
| **SEO Health** | ✅ Full — robots.txt check, page count, hreflang badges, external links |
| **Content Gaps** | ✅ Full — zero-result terms, brand CTR, top source pages |
| **Search Console** | ✅ Full — GSC API sync, KPIs, query table, opportunity flags |

The request is for **4 new sections**: Traffic Overview, Affiliate Performance (extended), Content Insights, and SEO Health placeholders. Most of this maps onto existing tabs, but there are genuine gaps:

**Actual gaps to fill:**
1. **Traffic Overview tab** — zero native pageview data. `user_browse_history` has 161 product-page views and `module_engagement_metrics` has ~850 events, but no daily visitor count or top-10-pages-by-views table exists. The existing "Traffic (GA4)" tab only links to external GA4.
2. **Clicks by source_type** — `affiliate_clicks` has `source_component` (sidebar_purchase, best_prices_section, product_card), not a `source_type` column. The existing AffiliatePanel doesn't show source_component breakdown.
3. **Conversion funnel: Page Views → Product Views → Affiliate Clicks** — data exists in `user_browse_history` (product views) and `affiliate_clicks` (clicks) and `session_id` is the join key. The SearchPanel already shows search→click but not pageview→click.
4. **Most viewed products without affiliate clicks** — this data CAN be computed (shown in my analysis: `user_browse_history LEFT JOIN affiliate_clicks ON product_slug`) but there's no UI panel for it.
5. **Filter usage patterns** — `filter_analytics` table is empty; no filter tracking is firing yet.
6. **Most compared products** — the `user_activity` table has comparison events but no panel shows this.

---

### Plan

The request maps cleanly to **enhancing existing tabs + creating one new "Traffic Overview" tab**. Avoid creating a new page — enhance the existing `/admin/analytics` dashboard.

---

### Changes By File

#### 1. **New: `TrafficOverviewPanel.tsx`** (replaces the current `TrafficPanel.tsx` content)
The current `TrafficPanel.tsx` is just links to GA4. Rebuild it as a real native data panel using internal tables, with GA4 links as a secondary section.

Data sources:
- **Daily product views** — `user_browse_history` grouped by date (last 30 days), producing a "sessions with product views" area chart
- **Top 10 pages** — `user_browse_history` JOIN `filaments/printers` to get product name + page URL, ranked by view count
- **Region breakdown** — `affiliate_clicks.region_code` used as a proxy for visitor region (since we don't have a raw pageview+region table). This is the best available signal.
- **KPI cards** — views today, this week, this month from `user_browse_history`

The GA4 links section moves to a collapsible "External Tools" card at the bottom.

#### 2. **Enhanced: `AffiliatePanel.tsx`** — add `source_component` breakdown
Add a new chart section: **"Clicks by Source" (bar chart)** using `affiliate_clicks.source_component` values (sidebar_purchase, best_prices_section, product_card, sticky_buy_bar, etc.).

Also add the **Conversion Funnel** card directly in the Affiliate tab:
- Step 1: Total product page views (from `user_browse_history`, last 30 days)
- Step 2: Unique sessions that clicked an affiliate link (from `affiliate_clicks`)
- Step 3: Conversion rate = step 2 / step 1

This is richer than the Search→Click funnel in SearchPanel because it uses actual product page views.

#### 3. **Enhanced: `ContentGapsPanel.tsx`** — add "Most Viewed Without Clicks" table
Add a new query that joins `user_browse_history` with `affiliate_clicks` on `filament_id`/`product_slug` to surface filaments with many views but zero affiliate clicks in the last 30 days. This becomes the "Most viewed products without affiliate clicks" table. Limit to top 15 results.

Also add a **"Most Compared Products"** section that queries `user_activity` where `activity_type = 'comparison'`.

#### 4. **Enhanced: `Analytics.tsx`** page — reorganize tabs
Rename the "Traffic (GA4)" tab to "Traffic Overview" and reorder tabs so the dashboard reads left-to-right in priority order:
```
Traffic Overview | Affiliate Performance | Search Insights | Content Insights | SEO Health | Content Gaps | Search Console
```

---

### New `TrafficOverviewPanel.tsx` — Data Architecture

```text
user_browse_history (161 rows and growing)
  ├── GROUP BY DATE(viewed_at) → daily views area chart
  ├── JOIN filaments ON filament_id → top pages table
  ├── COUNT by session_id → unique sessions KPI
  └── product_type breakdown → filament vs printer split

affiliate_clicks (35 rows, region_code always set)
  └── GROUP BY region_code → traffic by region pie chart
      (used as proxy for visitor region until GA4 API is wired)
```

**KPI Cards:**
- Views Today (user_browse_history WHERE viewed_at >= today)
- Views This Week
- Views This Month
- Total Unique Sessions (COUNT DISTINCT session_id)

**Charts:**
- Area chart: Daily product page views (30 days)
- Pie chart: Visits by region (from affiliate_clicks region_code)
- Table: Top 10 most-viewed products (filament + printer)

---

### Conversion Funnel (in AffiliatePanel)

```text
[Product Page Views] → [Affiliate Clicks] → [Conversion Rate]
      161 views           35 clicks             21.7%
```

The join is `session_id` across `user_browse_history` and `affiliate_clicks`. Sessions that appear in both = converted. This gives a meaningful funnel metric that currently doesn't exist anywhere in the dashboard.

---

### "Most Viewed Without Clicks" — in ContentGapsPanel

SQL logic (client-side aggregate):
1. Fetch all `user_browse_history` rows for last 30 days with `filament_id`
2. Fetch all `affiliate_clicks.product_id` (uuid) for last 30 days
3. Anti-join: filaments that appear in browse history but NOT in clicks
4. Sort by view count descending, take top 15

This surfaces products where users are landing but not buying — potential issues with buy button placement, pricing, or missing affiliate links.

---

### Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/analytics/TrafficOverviewPanel.tsx` | **Create** | New native traffic panel with KPIs, area chart, top pages, region pie |
| `src/components/admin/analytics/AffiliatePanel.tsx` | **Enhance** | Add source_component bar chart + page view → click funnel card |
| `src/components/admin/analytics/ContentGapsPanel.tsx` | **Enhance** | Add "most viewed without clicks" + "most compared" tables |
| `src/pages/admin/Analytics.tsx` | **Update** | Import TrafficOverviewPanel, reorder tabs, rename Traffic tab |

---

### Technical Notes

- **No new database tables or migrations needed** — all data exists
- **No new edge functions needed** — all queries use direct Supabase client calls
- `affiliate_clicks` doesn't have `source_type` — use `source_component` instead (sidebar_purchase, best_prices_section, product_card, sticky_buy_bar). The chart labels will be human-friendly.
- `filter_analytics` is empty — skip the "filter usage patterns" section entirely; it would just show an empty state. Document this with a placeholder note.
- The existing SearchPanel already has the search→click funnel. The new pageview→click funnel in AffiliatePanel is additive, not duplicative.
- All charts reuse the existing Recharts components, matching the FilaScope dark theme HSL CSS variables pattern used throughout the existing panels.
- The `region_code` proxy for traffic is honest — label the region pie as "Affiliate Click Regions" not "Visitor Regions" to avoid misleading data.
