

# Migration: Filament Onboarding Tool Tables

## Overview
Create 3 new admin-only tables for the filament onboarding workflow: brand scraping configs, onboarding jobs, and onboarding items. Single SQL migration using existing `has_role` pattern.

## Migration SQL Structure

### 1. `brand_scraping_configs`
- Stores per-brand scraping configuration (platform, URLs, variant mapping, spec extraction rules)
- `adapter_key` is unique — used to route to correct parsing logic
- Indexes on `adapter_key` and `brand_id`
- Auto-update `updated_at` trigger (reuses existing `update_listing_timestamp` pattern)

### 2. `filament_onboarding_jobs`
- Tracks each admin onboarding session (URL pasted → extraction → review → insert)
- Stores raw data, extracted filaments, errors, and counts
- Indexes on `brand_id`, `status`, `created_at DESC`
- Auto-update `updated_at` trigger

### 3. `filament_onboarding_items`
- Individual extracted filament records within a job
- Tracks per-item status, extracted prices, duplicate detection, admin overrides
- Foreign key to jobs with `ON DELETE CASCADE`
- Indexes on `job_id`, `status`, composite `(job_id, status)`

### RLS Policies
All three tables: RLS enabled, admin-only CRUD using `public.has_role(auth.uid(), 'admin')` — matching the project's established pattern (e.g., `scrape_errors`, `validation_runs`, `filament_properties`).

### Triggers
Two new triggers using dedicated functions (one per table) to set `updated_at = NOW()` on UPDATE.

## Files Changed

| File | Action |
|------|--------|
| New migration SQL | Create 3 tables, indexes, RLS policies, triggers |

No frontend changes in this task — tables only.

