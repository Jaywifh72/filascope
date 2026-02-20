
## Google Search Console Integration — Admin Analytics Dashboard

### Architecture Overview

The Google Search Console (GSC) API requires OAuth 2.0 with a **service account** — there is no simpler approach. The plan handles the credential complexity gracefully: the database table and full UI are built first, the edge function supports both "connected" and "no credentials" states, and a clear setup card guides credential entry. The dashboard degrades gracefully to an empty state until data arrives.

### Credential Strategy

GSC's API requires a **service account JSON key** (not a simple API key). The edge function will read this from a Supabase secret called `GSC_SERVICE_ACCOUNT_JSON`. The UI will show a "Connect Google Search Console" card when the secret is missing or when the table has no data. Setup instructions will be embedded directly in the panel so no external documentation is needed.

---

### Part 1 — Database Migration

Create the `search_console_data` table exactly as specified, plus a `search_console_config` table to store the site URL and sync metadata, and enable RLS (read-only for authenticated users, no public access since this is admin-only data):

```sql
CREATE TABLE public.search_console_data (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  query       TEXT,
  page        TEXT,
  clicks      INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr         DECIMAL(5,4),
  position    DECIMAL(5,2),
  country     TEXT,
  device      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX search_console_data_unique 
  ON search_console_data(date, query, page, country, device);

ALTER TABLE search_console_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read search_console_data"
  ON search_console_data FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role all search_console_data"
  ON search_console_data FOR ALL
  USING (auth.role() = 'service_role');
```

---

### Part 2 — Edge Function: `search-console-sync`

**File**: `supabase/functions/search-console-sync/index.ts`

The function handles three concerns:

**A. Authentication with GSC API (OAuth 2.0 service account)**

Service accounts use a signed JWT to get an access token. The function will:
1. Read `GSC_SERVICE_ACCOUNT_JSON` secret (contains `client_email`, `private_key`, `token_uri`)
2. Construct and sign a JWT using the service account's private key via the Web Crypto API (available in Deno/edge runtime — no external JWT library needed)
3. Exchange the JWT for a short-lived Bearer token from `https://oauth2.googleapis.com/token`
4. Use the Bearer token in all GSC API calls

**B. Data fetching from GSC API**

Endpoint: `POST https://searchconsoleapi.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`

Two requests per sync run:
1. **Query + page dimensions** (clicks, impressions, CTR, position by query + page)
2. **Device + country breakdown** (same metrics split by device and country)

Date range: yesterday (always syncs the previous day since GSC data has a 2-3 day lag; the function will fetch the last 3 days on first run to backfill).

Row limit: 25,000 per request (GSC maximum).

**C. Upsert to database**

Uses `INSERT ... ON CONFLICT DO UPDATE` via the `search_console_data_unique` index so re-runs are idempotent.

**Function structure:**

```typescript
Deno.serve(async (req) => {
  // 1. Check for credentials
  const credJson = Deno.env.get('GSC_SERVICE_ACCOUNT_JSON');
  if (!credJson) return { error: 'GSC_SERVICE_ACCOUNT_JSON not configured', status: 400 };
  
  // 2. Get OAuth token via service account JWT
  const accessToken = await getGscAccessToken(JSON.parse(credJson));
  
  // 3. Determine date range (default: last 3 days for backfill, or yesterday for cron)
  const body = await req.json().catch(() => ({}));
  const startDate = body.start_date || getDateDaysAgo(3);
  const endDate = body.end_date || getDateDaysAgo(1);
  
  // 4. Fetch from GSC API (query+page, device breakdowns)
  const rows = await fetchGscData(accessToken, siteUrl, startDate, endDate);
  
  // 5. Upsert to search_console_data
  const { count } = await supabase.from('search_console_data').upsert(rows, { onConflict: '...' });
  
  return { synced: count, date_range: `${startDate} to ${endDate}` };
});
```

**Cron setup**: Will be registered via the SQL cron insert tool (runs daily at 06:00 UTC, after GSC data settles):

```sql
SELECT cron.schedule(
  'search-console-sync-daily',
  '0 6 * * *',
  $$ SELECT net.http_post(...) $$
);
```

**Config**: `supabase/config.toml` — `verify_jwt = false` (validates admin auth in code).

---

### Part 3 — UI: New "Search Performance" Tab

**File**: `src/components/admin/analytics/SearchConsolePanel.tsx`

The panel has three states:
1. **Not connected** — shows a "Connect Google Search Console" setup card with step-by-step instructions
2. **Connected but loading** — skeleton cards
3. **Connected with data** — full dashboard

**Sub-sections:**

**A. Overview KPI row** (4 stat cards, 28-day totals):
- Total clicks | Total impressions | Average CTR | Average position

**B. Top Queries by Impressions** (table)
- Columns: Query | Impressions | Clicks | CTR | Avg Position
- Color-coded position column: green ≤3, yellow 4–10, orange 11–20, red >20
- Sortable by any column

**C. Top Pages by Clicks** (table)
- Columns: Page (truncated URL) | Clicks | Impressions | CTR
- Links open the page in a new tab

**D. CTR Trend Over Time** (line chart, 28 days)
- X: date, Y: daily average CTR
- Uses existing Recharts pattern from SearchPanel

**E. Position Distribution** (bar chart or stat grid)
- Top 3 | Top 10 | Top 11–20 | 20+
- Shows query counts in each bracket

**F. "Content Opportunities" section** (3 sub-cards):
- **Missing pages**: `impressions > 100 AND position IS NULL` (query has no dedicated landing page) — suggests creating content
- **Quick wins**: `position BETWEEN 4 AND 20` — suggests optimizing existing page
- **CTR underperformers**: `position < 10 AND ctr < 0.02` — suggests improving title/description

All queries run against `search_console_data` via Supabase client. React Query with 5-minute stale time.

---

### Part 4 — Analytics Page Updates

**File**: `src/pages/admin/Analytics.tsx`

- Add new import: `SearchConsolePanel`
- Add `<TabsTrigger value="gsc">Search Console</TabsTrigger>` to `TabsList`
- Add `<TabsContent value="gsc"><SearchConsolePanel /></TabsContent>`
- Update page description to mention Search Console

---

### Part 5 — Secret Configuration

Will request the `GSC_SERVICE_ACCOUNT_JSON` secret. The setup card in the UI will include the exact steps to create and download the service account key:
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Create a service account
3. Grant it "Search Console API" permissions
4. Add it as a user in Search Console for `https://filascope.com`
5. Create JSON key → download → paste entire JSON into the secret field

---

### File Change Summary

| File | Action |
|------|--------|
| Database migration | Create `search_console_data` table + RLS + unique index |
| `supabase/functions/search-console-sync/index.ts` | Create edge function |
| `supabase/config.toml` | Add `[functions.search-console-sync]` entry |
| `src/components/admin/analytics/SearchConsolePanel.tsx` | Create full UI panel |
| `src/pages/admin/Analytics.tsx` | Add "Search Console" tab |
| Cron SQL (via insert tool) | Schedule daily sync at 06:00 UTC |

No existing files are broken. The new tab appears alongside current tabs. The `GSC_SERVICE_ACCOUNT_JSON` secret must be added before data will flow.

---

### Google Search Console API — JWT Flow Detail

The Web Crypto API in Deno can sign RS256 JWTs natively. The flow:
```
service_account.json → extract private_key (PEM) → import as CryptoKey
→ build JWT header.payload → sign with RS256 → base64url encode
→ POST to token_uri → get { access_token, expires_in }
→ use "Bearer {access_token}" for all GSC API calls
```
This avoids any external JWT library dependency, keeping the function self-contained and fast to cold-start.
