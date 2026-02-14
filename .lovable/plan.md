

# Daily Price Sync Orchestrator

## Overview
Build an automated daily orchestrator that sequences brand price syncs using existing infrastructure (`sync-regional-prices`, `brand_sync_logs`, `automated_brands`), plus an admin UI with manual trigger and live progress.

## What Already Exists
- `sync-regional-prices` edge function: syncs regional prices for a single brand
- `brand_sync_logs` table: tracks all sync runs
- `automated_brands` table: has `scrape_frequency_hours`, `last_scrape_at`, `next_scrape_at`
- `CurrentSyncStatus` component: shows running syncs in real-time
- `SyncStatusTab`: admin dashboard for sync monitoring
- `BRAND_REGIONAL_DOMAINS` mapping in sync-regional-prices (defines which brands have regional stores)

## Implementation Steps

### 1. Database: Create `orchestration_runs` table

New table to track full orchestration runs (distinct from individual brand syncs in `brand_sync_logs`):

- `id` (uuid, primary key)
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz, nullable)
- `status` (text: 'running', 'completed', 'failed', 'partial')
- `brands_total` (integer)
- `brands_synced` (integer, default 0)
- `brands_failed` (text[], default '{}')
- `total_products_updated` (integer, default 0)
- `trigger_type` (text: 'cron', 'manual')
- `triggered_by_user` (uuid, nullable)
- `error_log` (jsonb, nullable)
- `summary` (jsonb, nullable -- duration, per-brand results)

RLS: Admin-only read/write via `has_role()`.

### 2. Edge Function: `daily-price-orchestrator`

Core logic:
1. Create an `orchestration_runs` row with status `running`
2. Query `automated_brands` for brands with regional domains configured
3. Sort by priority tier:
   - **Tier 1 (daily)**: bambu-lab, polymaker, prusament, esun, overture, elegoo, creality, anycubic
   - **Tier 2 (every 3 days)**: sunlu, eryone, hatchbox, colorfabb, fillamentum
   - **Tier 3 (weekly)**: remaining brands
4. Filter: skip brands synced within their tier's frequency window
5. For each eligible brand, call `sync-regional-prices` via HTTP POST with all configured regions and `dryRun: false`
6. Wait 3 seconds between brands (rate limiting)
7. Track results per brand, update `orchestration_runs` row progressively
8. On completion, update final status and summary
9. Use `EdgeRuntime.waitUntil()` for background execution, return job ID immediately

The function accepts `{ trigger: 'cron' | 'manual', userId?: string }`.

Set `verify_jwt = false` in config.toml (cron calls won't have JWT; manual calls validate auth in code).

### 3. Cron Job: Schedule at 2 AM EST daily

Use `pg_cron` + `pg_net` to call the orchestrator:

```text
Schedule: 0 7 * * *  (7 AM UTC = 2 AM EST)
```

Calls `daily-price-orchestrator` with `{ "trigger": "cron" }`.

No retry mechanism built into pg_cron natively -- the orchestrator itself will handle partial failures gracefully (continue to next brand on error, mark run as 'partial' if some brands fail).

### 4. Admin UI: Orchestration Dashboard

Add to `SyncStatusTab.tsx` a new section above the existing content:

- **"Run Full Price Sync" button**: Calls the orchestrator with `trigger: 'manual'`
- **Last Orchestration Run card**: Shows status, brands synced/failed, products updated, duration
- **Staleness alert**: Warning banner if no orchestration run in 36+ hours
- Real-time progress via polling `orchestration_runs` table (reuses existing 2s polling pattern from `CurrentSyncStatus`)

New component: `OrchestrationControl.tsx` in `src/components/admin/inventory/sync-status/`

### 5. Email Notification (Simplified)

Rather than a full email system (which would need an email API key), the orchestrator will:
- Log a completion summary to `orchestration_runs.summary` (jsonb)
- The admin dashboard displays this prominently
- The 36-hour staleness warning serves as the "alert if not run" mechanism

If you want actual email delivery later, we can add a Resend or SendGrid integration.

## Technical Details

### Edge Function Structure

```text
supabase/functions/daily-price-orchestrator/index.ts
```

Flow:
1. Parse request, determine trigger type
2. For manual triggers: validate admin auth
3. Create orchestration_runs record
4. Return immediately with run ID
5. Background (waitUntil): iterate brands, call sync-regional-prices, update progress

### Brands with Regional Domains (eligible for orchestration)

From the existing `BRAND_REGIONAL_DOMAINS` map: bambu-lab, elegoo, polymaker, creality, anycubic, qidi, flashforge, sunlu, eryone, jayo, kingroon, sovol, artillery, longer, two-trees, geeetech, voxelab (17 brands).

### Files to Create
- `supabase/functions/daily-price-orchestrator/index.ts`
- `src/components/admin/inventory/sync-status/OrchestrationControl.tsx`

### Files to Modify
- `supabase/config.toml` -- add function config
- `src/components/admin/inventory/SyncStatusTab.tsx` -- add OrchestrationControl

### Database Changes
- New `orchestration_runs` table with RLS policies
- pg_cron job (via SQL insert, not migration)

