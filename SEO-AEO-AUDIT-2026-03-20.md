# FilaScope SEO & AEO Comprehensive Audit
**Date:** March 20, 2026
**Site:** https://filascope.com
**Goal:** First page Google/Bing/DuckDuckGo for filament queries + AI platform citations

---

## EXECUTIVE SUMMARY

FilaScope has **strong foundational SEO** but critical gaps preventing first-page dominance. The site has excellent structured data (5 JSON-LD schemas on homepage), good meta tags, and a unique data moat (TD values + live pricing). However, **the #1 blocker is that it's a client-side rendered SPA** — crawlers that don't execute JavaScript see minimal content. The prerender edge function exists but is only triggered for known bot user agents, which misses many crawlers.

### Current Ranking Position (March 2026)

| Query Category | FilaScope Position | Verdict |
|---|---|---|
| "compare 3D printer filaments" | **NOT IN TOP 10** | ❌ Critical gap |
| "HueForge TD values database" | **#2** (after Prusa) | ✅ Strong |
| "best PLA filament comparison 2026" | **NOT IN TOP 10** | ❌ Major gap |
| "filament price comparison tool" | **NOT IN TOP 10** | ❌ Lost to SpoolPrices, 3DFilamentPrice |
| "3D printer filament database specs" | **#6** (via TD page) | ⚠️ Moderate |
| "filament color comparison tool" | **#5** (via /colors) | ⚠️ Moderate |
| "filament temperature chart" | **NOT IN TOP 10** | ❌ Major gap |
| "PLA vs PETG comparison 2026" | **NOT IN TOP 10** | ❌ Lost to All3DP, eufymake |
| "cheapest PLA filament deals" | **NOT IN TOP 10** | ❌ Shopping intent missed |
| "strongest 3D printer filament" | **NOT IN TOP 10** | ❌ Lost to MatterHackers, All3DP |
| "filascope.com" (branded) | **#1** | ✅ Expected |

### Key Competitors Outranking FilaScope

1. **All3DP** — Dominates informational queries with long-form editorial content
2. **MatterHackers** — Strong for comparison + shopping queries (retailer advantage)
3. **Bambu Lab** — Owns branded filament guide queries
4. **3DFilamentProfiles.com** — Direct competitor for database/tracking
5. **SpoolPrices.com** — New competitor beating us on price comparison
6. **FilamentColors.xyz** — Beating us on color matching

---

## PHASE 2: TECHNICAL SEO STATUS

### Homepage (/)
- **Title:** "FilaScope — Compare 3D Printer Filaments, Specs & Prices" ✅
- **Meta Description:** Present and unique ✅
- **Canonical:** `https://filascope.com/` ✅
- **OG Tags:** Present ✅
- **Robots:** `index, follow, max-image-preview:large` ✅
- **JSON-LD:** 5 schemas (WebSite, SiteNavigationElement, Organization, FAQPage, ItemList) ✅
- **H1:** "Find Your Perfect Filament" ✅
- **H2 count:** 8 ✅
- **Images without alt:** 0 of 67 ✅ (excellent)
- **Internal links:** 158 ✅

### Performance
- **DOM Content Loaded:** 1,026ms ✅
- **Load Complete:** 3,249ms ⚠️ (could be faster)
- **Resources:** 183 requests ⚠️ (high — code splitting would help)

### Critical Technical Issues

#### 1. CLIENT-SIDE RENDERING (CSR) — SEVERITY: CRITICAL
The site is a React SPA. Without JavaScript execution, crawlers see only the `<noscript>` fallback and prerendered static HTML. The Netlify/Cloudflare edge function intercepts known bot user agents and proxies to the Supabase `prerender` function, but:
- **Only known bots are detected** — new AI crawlers may be missed
- **Prerender function is a single point of failure** — if it errors, crawlers see empty `<div id="root"></div>`
- **16,107 filament pages** rely entirely on prerender — any downtime means those pages appear empty to Google

#### 2. SITEMAP ISSUES — SEVERITY: HIGH
- `_redirects` routes `/sitemap.xml` to the dynamic Supabase edge function, but Cloudflare Pages doesn't process `_redirects` the same way Netlify does
- Static sitemap files (`sitemap-filaments.xml`, etc.) are stale snapshots from March 13
- Individual filament pages are in the sitemap but many may not be crawled due to SPA rendering

#### 3. MISSING PRERENDER FOR CLOUDFLARE PAGES — SEVERITY: HIGH
The Netlify edge function at `netlify/edge-functions/prerender.ts` won't work on Cloudflare Pages. Need to create a Cloudflare Worker equivalent or use `_worker.js` for bot detection and prerendering.

#### 4. NO `www` → ROOT REDIRECT — SEVERITY: MEDIUM
Both `www.filascope.com` and `filascope.com` resolve, potentially splitting link equity. Need a canonical redirect.

---

## PHASE 3: CONTENT & KEYWORD STRATEGY

### Content Gaps (What Competitors Rank For That We Don't)

| Missing Content | Search Volume | Competitor Ranking | Priority |
|---|---|---|---|
| "Best PLA filament 2026" buying guide | HIGH | All3DP #1, Tom's Hardware #4 | P0 |
| "3D printer filament temperature chart" | HIGH | Spool3D, All3DP, Creality | P0 |
| "PLA vs PETG vs ABS" comparison article | HIGH | All3DP, UltiMaker, Xometry | P0 |
| "Cheapest filament deals" price tracker | MEDIUM | SpoolPrices #1 | P1 |
| "Strongest 3D filament" guide | MEDIUM | All3DP, Siraya Tech | P1 |
| "Best filament for Bambu Lab" | MEDIUM | Forum posts, YouTube | P1 |
| "Filament storage guide" | MEDIUM | All3DP, YouTube | P2 |
| "3D printer buyer's guide 2026" | HIGH | Tom's Hardware, All3DP | P2 |

### AEO (AI Engine Optimization) Status

| Element | Status | Impact |
|---|---|---|
| `llms.txt` at site root | ✅ Present | AI crawlers can discover site purpose |
| `llms-full.txt` | ✅ Present | Detailed content for AI indexing |
| Structured FAQ data | ✅ Present (FAQPage schema) | High — AI engines extract Q&A pairs |
| AI snippet zones | ✅ Present on guides | Good — provides extractable summaries |
| Entity definitions | ⚠️ Partial | Need clearer "FilaScope is..." statements |
| Cloudflare AI bot blocking | ✅ Fixed (set to allow) | Critical — was blocking all AI crawlers |
| robots.txt AI bot directives | ✅ Allows GPTBot, ClaudeBot, etc. | Correct configuration |

### What AI Platforms Need to Cite FilaScope

1. **Factual, structured data** — Our 16K filament database IS this. But it needs to be accessible.
2. **Authoritative content** — Need more "definitive guide" style articles
3. **Unique data** — TD values are our moat. No competitor has this at our scale.
4. **Clear attribution hints** — "According to FilaScope's database of 16,000+ filaments..."
5. **Schema.org markup** — Already strong (5 types), but need Dataset schema for the TD database

---

## PHASE 4: PRIORITIZED ACTION PLAN

### P0 — CRITICAL (Do This Week)

#### P0-1: Fix Prerendering for Cloudflare Pages
**What:** The prerender bot detection currently uses a Netlify edge function. On Cloudflare Pages, this doesn't execute. Need to create a Cloudflare Worker or use `_worker.js`.
**Why:** Without this, Googlebot and AI crawlers see empty HTML for all JavaScript-rendered pages. This single issue undermines ALL other SEO work.
**Impact:** 10x — enables indexing of 16,000+ filament pages

#### P0-2: Fix Sitemap Routing on Cloudflare
**What:** The `_redirects` file routes `/sitemap.xml` to Supabase, but Cloudflare Pages uses `_redirects` differently than Netlify. Need to verify sitemaps are actually being served.
**Why:** Without a working sitemap, Google can't discover the 16,000+ filament pages efficiently.
**Impact:** HIGH — enables discovery of all pages

#### P0-3: Create "Best PLA Filament 2026" Guide
**What:** Long-form (2,000+ word) buying guide with data from our database — top picks, price comparisons, spec tables.
**Why:** This is the #1 highest-volume filament query. Every competitor has one. We don't.
**Impact:** HIGH — captures high-intent commercial traffic

#### P0-4: Create "3D Filament Temperature Chart" Page
**What:** Interactive temperature chart page backed by our database data (already created as `FilamentTemperatureChart.tsx` but needs indexing)
**Why:** "filament temperature chart" is a high-volume query we're invisible for
**Impact:** HIGH — captures informational traffic

### P1 — HIGH IMPACT (Do This Month)

#### P1-1: Add Dataset Schema to TD Database
**What:** Add Schema.org `Dataset` markup to `/hueforge-td-database` — name, description, distribution format, license, number of records
**Why:** This tells AI engines and Google that our TD data is a structured dataset, not just a web page. Google Dataset Search could index it.
**Impact:** HIGH for AEO — AI engines prioritize structured datasets

#### P1-2: Create Material Comparison Hub
**What:** Create `/guides/pla-vs-petg`, `/guides/petg-vs-abs`, `/guides/pla-vs-abs` with side-by-side spec comparisons
**Why:** "X vs Y filament" queries have high volume and high intent. We have guides but they're not ranking.
**Impact:** MEDIUM-HIGH — captures comparison shopping traffic

#### P1-3: Build Price Alert / Deal Tracker Page
**What:** Dedicated `/deals` page showing current best prices, price drops, and deals
**Why:** SpoolPrices.com is beating us on price comparison queries. We have the data but no dedicated page.
**Impact:** MEDIUM — captures shopping intent

#### P1-4: Add `hreflang` Tags for Regional Pricing
**What:** Since we serve pricing in multiple currencies (USD, CAD, EUR, GBP, AUD, JPY), add hreflang annotations
**Why:** Helps search engines serve the right currency/region to users
**Impact:** MEDIUM — improves international rankings

#### P1-5: Create Cloudflare Worker for Dynamic OG Images
**What:** Generate unique OG images per filament page showing the filament color, name, price, and specs
**Why:** Dramatically improves click-through from social shares and search results
**Impact:** MEDIUM — improves CTR

### P2 — MEDIUM IMPACT (Do This Quarter)

#### P2-1: Internal Linking Overhaul
**What:** Add "Related Filaments" sections to every filament detail page, cross-link between guides, add breadcrumb trails
**Why:** Google uses internal links to discover and prioritize pages. Our 16K filament pages need interconnection.

#### P2-2: Backlink Strategy
**What:** Create embeddable widgets (TD lookup, price comparison) that 3D printing blogs can embed with attribution
**Why:** Backlinks from authoritative 3D printing sites signal authority to Google

#### P2-3: Video Schema for Guide Pages
**What:** Add VideoObject schema to guide pages that could embed tutorial content
**Why:** Google increasingly shows video results for "how to" queries

#### P2-4: Create API Documentation Page
**What:** Public API docs at `/api-docs` for developers to access filament data
**Why:** Generates backlinks from developer communities, establishes FilaScope as the data authority

### P3 — ONGOING

#### P3-1: Weekly Content Publishing
- 1 buying guide per week
- 1 brand spotlight per week
- Update all guides with current pricing monthly

#### P3-2: Monitor AI Citations
- Track mentions across ChatGPT, Claude, Gemini, Perplexity
- Update `llms.txt` and `llms-full.txt` quarterly

#### P3-3: Google Search Console Monitoring
- Weekly: Check indexing status, crawl errors
- Monthly: Review top queries, CTR optimization
- Quarterly: Full technical re-audit

---

## PHASE 5: IMMEDIATE EXECUTION ITEMS

These are ready to execute right now in Claude Code:

### 1. Fix Cloudflare Pages Prerendering (P0-1)
Create `_worker.js` or Cloudflare Worker that detects bot user agents and proxies to the Supabase prerender function. This is the single most impactful change.

### 2. Verify Sitemap Serving (P0-2)
Test if `https://filascope.com/sitemap.xml` actually returns XML or falls through to the SPA catch-all.

### 3. Add Dataset Schema to TD Database (P1-1)
Add JSON-LD Dataset markup to the HueForge TD database page.

### 4. Add `www` → root redirect in Cloudflare DNS
Delete the `www` CNAME or set up a redirect rule.

### 5. Update Static Page Count
The generate-static-pages.js script creates 113 pages — ensure the new temperature chart and other new pages are included.

---

## EXPECTED IMPACT TIMELINE

| Timeframe | Expected Result |
|---|---|
| 1 week (after P0 fixes) | Google starts indexing 1,000+ filament pages |
| 1 month | "filament temperature chart" → page 1; "HueForge TD" → #1 |
| 3 months | "compare 3D filaments" → page 1; "best PLA filament" → top 5 |
| 6 months | 50K+ organic monthly visits; AI citation rate 3x current |
| 12 months | Authority site status; 100K+ organic; default AI reference |
