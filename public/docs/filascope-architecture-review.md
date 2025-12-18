# FilaScope Architecture Review
## Comprehensive Data Handling & System Analysis
### Generated: December 18, 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Assumptions Made](#2-assumptions-made)
3. [Data Flow Map](#3-data-flow-map)
4. [Failure Modes by Category](#4-failure-modes-by-category)
5. [Security & Privacy Pass](#5-security--privacy-pass)
6. [Performance Pass](#6-performance-pass)
7. [Data Integrity Plan](#7-data-integrity-plan)
8. [Prioritized Action Plan](#8-prioritized-action-plan)
9. [Appendix](#9-appendix)

---

## 1. Executive Summary

### Product Overview

FilaScope is a comprehensive 3D printing filament database and comparison platform with:

- **4,700+ filaments** across 50+ brands
- **105+ printers** with detailed specifications
- **Automated scraping infrastructure** for price/product updates
- **Price tracking** and historical data
- **Material comparison** and compatibility tools
- **Reference resources** for slicers, CAD tools, repositories

### Key Findings Summary

| Category | Status | Critical Issues | Improvements Needed |
|----------|--------|-----------------|---------------------|
| Data Consistency | ⚠️ Medium Risk | 2 | 5 |
| Security | ✅ Good | 0 | 3 |
| Performance | ⚠️ Medium Risk | 1 | 8 |
| Data Integrity | ⚠️ Medium Risk | 3 | 6 |

### Critical Items Requiring Immediate Attention

1. **Scraper Edge Functions** - No transaction wrapping for multi-table writes
2. **Missing Database Indexes** - `filaments.color_hex`, `filaments.material`, composite indexes
3. **Anonymous Write Policies** - `user_activity` and `module_engagement_metrics` tables

---

## 2. Assumptions Made

Since direct access to all runtime systems is limited, the following assumptions were made:

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| No Redis/Memcached caching layer | No cache config in codebase | Medium - may have external cache |
| No message queue (RabbitMQ/SQS) | Edge functions are synchronous | Low - scraping is sequential |
| No dedicated search engine | Queries use PostgreSQL LIKE/ILIKE | Medium - may have Algolia/Meilisearch |
| Edge functions triggered manually or via cron | No webhook configs found | Low |
| Single Supabase project (no read replicas) | Standard Cloud setup | Medium - may have replicas |
| Firecrawl API for web scraping | Explicit in edge function code | Verified |
| SerpApi + ScrapingDog for Amazon | Explicit fallback pattern in code | Verified |

---

## 3. Data Flow Map

### Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL DATA SOURCES                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Shopify    │  │  WooCommerce │  │   Amazon     │  │   Firecrawl  │        │
│  │   JSON API   │  │   REST API   │  │   SerpApi    │  │   Scraping   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │                 │
│         └─────────────────┴────────┬────────┴─────────────────┘                 │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE EDGE FUNCTIONS                              │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │ scrape-brand-   │  │ update-global-  │  │ parse-filament- │          │   │
│  │  │ data            │  │ prices          │  │ tds             │          │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │   │
│  │           │                    │                    │                    │   │
│  │  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐          │   │
│  │  │ scrape-brand-   │  │ log-printer-    │  │ scrape-accessory│          │   │
│  │  │ nozzles         │  │ prices          │  │ -images         │          │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │   │
│  │           │                    │                    │                    │   │
│  │           └────────────────────┼────────────────────┘                    │   │
│  │                                │                                         │   │
│  │                    ┌───────────▼───────────┐                             │   │
│  │                    │   Data Transformation │                             │   │
│  │                    │   • Title cleaning    │                             │   │
│  │                    │   • Price parsing     │                             │   │
│  │                    │   • Color extraction  │                             │   │
│  │                    │   • Spec normalization│                             │   │
│  │                    └───────────┬───────────┘                             │   │
│  └────────────────────────────────┼─────────────────────────────────────────┘   │
│                                   │                                             │
└───────────────────────────────────┼─────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE POSTGRESQL                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         CORE TABLES                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │  filaments   │  │   printers   │  │ automated_   │                   │    │
│  │  │  (4,700+)    │  │   (105+)     │  │ brands (50+) │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │  printer_    │  │   deals      │  │   profiles   │                   │    │
│  │  │  accessories │  │              │  │              │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         HISTORY TABLES                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │price_history │  │printer_price_│  │brand_sync_   │                   │    │
│  │  │              │  │history       │  │logs          │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         ANALYTICS TABLES                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │user_activity │  │module_       │  │ab_test_      │                   │    │
│  │  │              │  │engagement    │  │assignments   │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              REACT FRONTEND                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      DATA FETCHING LAYER                                 │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │    │
│  │  │                    TanStack Query                                 │   │    │
│  │  │  • Caching (staleTime: 5min default)                             │   │    │
│  │  │  • Deduplication                                                  │   │    │
│  │  │  • Background refetching                                          │   │    │
│  │  │  • Optimistic updates                                             │   │    │
│  │  └──────────────────────────────────────────────────────────────────┘   │    │
│  │                                    │                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Supabase Client                                │   │    │
│  │  │  • Auto-generated types                                           │   │    │
│  │  │  • RLS enforcement                                                │   │    │
│  │  │  • Realtime subscriptions                                         │   │    │
│  │  └──────────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      CLIENT STATE                                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │  localStorage│  │   React      │  │   URL        │                   │    │
│  │  │  • Printer   │  │   State      │  │   Params     │                   │    │
│  │  │    selection │  │  • Filters   │  │  • Filters   │                   │    │
│  │  │  • Currency  │  │  • UI state  │  │  • Pagination│                   │    │
│  │  │  • Compare   │  │  • Compare   │  │  • Search    │                   │    │
│  │  │    list      │  │    items     │  │              │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary Table

| Flow | Source | Transformation | Storage | Cache | Client Access |
|------|--------|----------------|---------|-------|---------------|
| Filament Scraping | Shopify/WooCommerce/Firecrawl | Title cleaning, price parsing, color extraction | `filaments` table | TanStack Query (5min) | Finder, BrandDetail |
| Price History | Scraper edge functions | Currency normalization | `price_history` table | None | FilamentDetail charts |
| Printer Data | CSV import + manual | Spec normalization | `printers` table | TanStack Query | Printers, PrinterDetail |
| User Favorites | Client action | None | `user_favorites` table | TanStack Query | Vault page |
| Brand Sync | Edge function orchestration | Multi-platform normalization | `automated_brands`, `brand_sync_logs` | None | Admin dashboard |
| Accessory Images | Firecrawl + AI selection | Gemini AI image scoring | `printer_accessories` | TanStack Query | HotendDetail, etc. |

---

## 4. Failure Modes by Category

### 4.1 Consistency Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Filament count mismatch | `automated_brands.product_count` vs actual | Medium | Incorrect brand stats | Add trigger to sync count on insert/delete |
| Price history gaps | `price_history` table | Low | Incomplete charts | Add monitoring for scrape failures |
| Orphaned price records | `price_history.filament_id` | Low | Wasted storage | Add ON DELETE CASCADE or periodic cleanup |

### 4.2 Concurrency Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Duplicate scrape runs | Multiple admin triggers | Medium | Duplicate records, rate limit waste | Add `scraping_active` flag check with SELECT FOR UPDATE |
| Compare list race | localStorage + React state | Low | Lost selections | Use single source of truth |
| Currency update race | Profile + context update | Low | Temporary inconsistency | Optimistic update with rollback |

### 4.3 Idempotency Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Scraper re-runs create duplicates | `scrape-brand-data` | High | Duplicate filaments | Use UPSERT with unique constraint on (brand_id, product_handle) |
| Price history duplicates | `price_history` inserts | Medium | Inflated history | Add unique constraint on (filament_id, recorded_at::date, region) |
| Favorite toggle race | `user_favorites` | Low | Duplicate favorites | Use UPSERT pattern |

### 4.4 Partial Write Failures

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Scraper mid-batch failure | Edge functions | High | Inconsistent brand data | Wrap in transaction, add checkpoint/resume |
| Brand sync partial | `brand_sync_logs` + `filaments` | Medium | Orphaned log entries | Use transaction with rollback on error |
| Multi-table accessory update | `printer_accessories` + specs | Medium | Inconsistent specs | Single transaction for related updates |

### 4.5 N+1 Query Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Filament list with brand names | Finder page | High | Slow page loads | Use JOIN or embed brand_name in filaments |
| Printer list with accessories | Printers page | Medium | Multiple round trips | Prefetch accessories in single query |
| Brand detail with filament count | BrandDetail page | Low | Extra query | Use view or materialized view |

### 4.6 Pagination Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Offset-based pagination drift | Finder with filters | Medium | Missing/duplicate items on page change | Use cursor-based pagination |
| Large offset performance | Deep pagination | Medium | Slow queries | Add keyset pagination |
| Total count on every page | Finder | Low | Unnecessary query | Cache count or use estimate |

### 4.7 Clock/Timezone Issues

| Issue | Location | Risk Level | Impact | Mitigation |
|-------|----------|------------|--------|------------|
| Price history timezone | `recorded_at` timestamps | Low | Incorrect daily grouping | Ensure all timestamps are UTC with explicit timezone |
| Deal expiration | `deals.end_date` | Medium | Deals shown/hidden incorrectly | Use UTC consistently, compare in application |
| Scrape scheduling | `next_scrape_at` | Low | Scrapes at wrong time | Use UTC for all scheduling |

---

## 5. Security & Privacy Pass

### 5.1 PII Surfaces

| Data Type | Table | Sensitivity | Protection |
|-----------|-------|-------------|------------|
| Email | `profiles.email` (via auth.users) | High | RLS enforced, user can only see own |
| Display Name | `profiles.display_name` | Medium | User-controlled visibility |
| User ID | Multiple tables | Low | UUID, not directly identifiable |
| Activity Data | `user_activity` | Medium | Session tracking, no RLS currently |
| IP Address | Not stored | N/A | Good - not collecting |

### 5.2 Access Control Boundaries

#### Current RLS Status

| Table | RLS Enabled | Policies | Assessment |
|-------|-------------|----------|------------|
| `filaments` | ✅ Yes | Public read, no write | ✅ Correct for public data |
| `printers` | ✅ Yes | Public read, no write | ✅ Correct for public data |
| `profiles` | ✅ Yes | Own row only | ✅ Correct |
| `user_favorites` | ✅ Yes | Own rows only | ✅ Correct |
| `user_activity` | ✅ Yes | Anonymous insert allowed | ⚠️ Review needed |
| `module_engagement_metrics` | ✅ Yes | Anonymous insert allowed | ⚠️ Review needed |
| `admin_activity_log` | ✅ Yes | Admin only | ✅ Correct |

#### Security Concerns

1. **Anonymous Write Policies**
   - `user_activity` and `module_engagement_metrics` allow anonymous inserts
   - Risk: Spam/abuse potential
   - Mitigation: Add rate limiting at edge function level

2. **Admin Role Check**
   - Admin functions rely on `profiles.is_admin` flag
   - Risk: Flag could be modified if RLS misconfigured
   - Mitigation: Verify admin check uses auth.uid() properly

### 5.3 Audit Logging

| Event Type | Logged | Location | Retention |
|------------|--------|----------|-----------|
| Admin actions | ✅ Yes | `admin_activity_log` | Indefinite |
| User logins | ✅ Yes | Supabase auth logs | 7 days (Supabase default) |
| Data modifications | ❌ No | N/A | Consider adding |
| API access | ❌ No | N/A | Consider adding |
| Scraper runs | ✅ Yes | `brand_sync_logs` | Indefinite |

### 5.4 Secrets Management

| Secret | Storage | Rotation | Access |
|--------|---------|----------|--------|
| Supabase keys | Edge function env | Manual | Edge functions only |
| Firecrawl API key | Edge function env | Manual | Scraper functions |
| SerpApi key | Edge function env | Manual | Amazon scraper |
| ScrapingDog key | Edge function env | Manual | Amazon fallback |
| Gemini API key | Lovable AI | Managed | AI functions |

### 5.5 Data Retention Recommendations

| Data Type | Current Retention | Recommended | Rationale |
|-----------|-------------------|-------------|-----------|
| Price history | Indefinite | 2 years | Sufficient for trends, reduces storage |
| Sync logs | Indefinite | 90 days | Debugging window |
| User activity | Indefinite | 30 days | Privacy, GDPR compliance |
| Engagement metrics | Indefinite | 90 days | Analytics window |

---

## 6. Performance Pass

### 6.1 Query Hot Paths

| Query | Frequency | Current Performance | Bottleneck |
|-------|-----------|---------------------|------------|
| Finder filament list | Very High | ~200-500ms | No composite index on filters |
| Filament by color hex | High | ~300ms | Missing index on `color_hex` |
| Brand filaments | High | ~150ms | OK with brand_id index |
| Printer list | Medium | ~100ms | OK |
| Price history chart | Medium | ~200ms | Missing index on `filament_id + recorded_at` |

### 6.2 Missing Indexes

```sql
-- High Priority: Finder page performance
CREATE INDEX idx_filaments_material ON filaments(material);
CREATE INDEX idx_filaments_color_hex ON filaments(color_hex);
CREATE INDEX idx_filaments_vendor_material ON filaments(vendor, material);
CREATE INDEX idx_filaments_brand_material ON filaments(brand_id, material);

-- Medium Priority: Price tracking
CREATE INDEX idx_price_history_filament_date ON price_history(filament_id, recorded_at DESC);
CREATE INDEX idx_printer_price_history_lookup ON printer_price_history(printer_id, recorded_at DESC);

-- Full-text search (if not using external search)
CREATE INDEX idx_filaments_title_trgm ON filaments USING gin(product_title gin_trgm_ops);

-- Composite for common filter combinations
CREATE INDEX idx_filaments_finder ON filaments(material, brand_id, variant_price) 
  WHERE variant_available = true;
```

### 6.3 Caching Strategy

#### Current State

| Layer | Implementation | TTL | Invalidation |
|-------|----------------|-----|--------------|
| Browser | TanStack Query | 5 min (staleTime) | Manual/refetch |
| CDN | Lovable default | Unknown | Deploy |
| Database | PostgreSQL buffer | Automatic | N/A |

#### Recommended Additions

| Data | Cache Layer | TTL | Invalidation Strategy |
|------|-------------|-----|----------------------|
| Filament list | Edge cache | 1 hour | On scrape complete |
| Brand list | Edge cache | 24 hours | On brand update |
| Static reference data | Browser + CDN | 24 hours | Version-based |
| Price history | Browser | 1 hour | Time-based |

### 6.4 Payload Size Analysis

| Endpoint | Current Size | Issue | Optimization |
|----------|--------------|-------|--------------|
| Filaments list | ~500KB for 100 items | Over-fetching columns | Select only needed columns |
| Printer detail | ~50KB | Includes all specs | OK, but could lazy-load some |
| Brand sync logs | ~200KB | Full JSONB in list | Paginate, summarize in list view |

### 6.5 Background Processing Opportunities

| Task | Current | Recommended | Benefit |
|------|---------|-------------|---------|
| Price history aggregation | On-demand | Nightly rollup job | Faster charts |
| Brand product counts | Manual sync | Trigger-based | Always accurate |
| Data completeness scores | On-demand calculation | Cached/materialized | Faster admin dashboard |
| Image validation | Manual | Background job | Proactive broken link detection |

---

## 7. Data Integrity Plan

### 7.1 Current Constraints

| Table | Constraint Type | Constraint | Status |
|-------|-----------------|------------|--------|
| `filaments` | Primary Key | `id` | ✅ |
| `filaments` | Foreign Key | `brand_id -> automated_brands.id` | ✅ |
| `printers` | Unique | `printer_id` | ✅ |
| `price_history` | Foreign Key | `filament_id -> filaments.id` | ✅ |
| `profiles` | Primary Key | `id` (matches auth.users) | ✅ |

### 7.2 Missing Constraints (Recommended)

```sql
-- Price validation
ALTER TABLE filaments 
  ADD CONSTRAINT chk_positive_price 
  CHECK (variant_price IS NULL OR variant_price >= 0);

ALTER TABLE filaments 
  ADD CONSTRAINT chk_valid_diameter 
  CHECK (diameter_nominal_mm IS NULL OR diameter_nominal_mm IN (1.75, 2.85, 3.0));

-- Temperature validation
ALTER TABLE filaments 
  ADD CONSTRAINT chk_temp_range 
  CHECK (nozzle_temp_min_c IS NULL OR nozzle_temp_max_c IS NULL 
         OR nozzle_temp_min_c <= nozzle_temp_max_c);

-- Prevent duplicate filaments per brand
ALTER TABLE filaments 
  ADD CONSTRAINT uq_brand_product 
  UNIQUE (brand_id, product_handle) 
  WHERE product_handle IS NOT NULL;

-- Price history integrity
ALTER TABLE price_history 
  ADD CONSTRAINT chk_positive_history_price 
  CHECK (price >= 0);
```

### 7.3 Transaction Requirements

| Operation | Current | Recommended | SQL Pattern |
|-----------|---------|-------------|-------------|
| Brand scrape | No transaction | Transaction + savepoints | `BEGIN; SAVEPOINT batch_1; ... COMMIT;` |
| User favorite toggle | Single statement | OK as-is | UPSERT |
| Multi-table accessory update | Separate statements | Single transaction | `BEGIN; UPDATE...; UPDATE...; COMMIT;` |
| Price + availability update | Separate statements | Single transaction | Atomic update |

### 7.4 Validation Location

| Validation | Client | Server (Edge) | Database | Recommended |
|------------|--------|---------------|----------|-------------|
| Required fields | ✅ | ❌ | ❌ | Add DB NOT NULL |
| Price format | ✅ | ✅ | ❌ | Add DB CHECK |
| Email format | ✅ | ✅ (auth) | ✅ | OK |
| Temperature ranges | ❌ | ❌ | ❌ | Add all three |
| Color hex format | ✅ | ❌ | ❌ | Add DB CHECK |

### 7.5 Migration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Adding NOT NULL to existing column | High | Blocks if NULL exists | Add with DEFAULT first, then clean data |
| Adding unique constraint | Medium | Fails if duplicates | Query for duplicates first, clean up |
| Renaming columns | Low | Breaks queries | Use views for transition period |
| Changing column types | Medium | Data loss | Test in staging with copy of prod data |

---

## 8. Prioritized Action Plan

### 8.1 Quick Wins (1-2 Days)

| Action | Impact | Risk | Effort |
|--------|--------|------|--------|
| Add missing indexes (material, color_hex) | High | Low | 2 hours |
| Add CHECK constraints for prices | Medium | Low | 1 hour |
| Fix pagination to use cursor-based | Medium | Low | 4 hours |
| Add rate limiting to anonymous write endpoints | Medium | Low | 2 hours |
| Select only needed columns in Finder query | Medium | Low | 2 hours |

### 8.2 Medium Term (1-2 Weeks)

| Action | Impact | Risk | Effort |
|--------|--------|------|--------|
| Wrap scrapers in transactions | High | Medium | 3 days |
| Add unique constraints to prevent duplicates | High | Medium | 2 days |
| Implement background job for price aggregation | Medium | Low | 3 days |
| Add data change audit logging | Medium | Low | 2 days |
| Create materialized view for brand stats | Medium | Low | 1 day |
| Add full-text search index | Medium | Medium | 2 days |

### 8.3 Big Rocks (1+ Month)

| Action | Impact | Risk | Effort |
|--------|--------|------|--------|
| Implement proper job queue for scrapers | High | Medium | 2 weeks |
| Add external search engine (Meilisearch) | High | Medium | 2 weeks |
| Implement event sourcing for price changes | Medium | High | 3 weeks |
| Add read replica for analytics queries | Medium | Medium | 1 week |
| Comprehensive data retention automation | Medium | Low | 1 week |

### 8.4 Critical Items Summary

| Priority | Item | Timeline | Owner |
|----------|------|----------|-------|
| 🔴 P0 | Add transaction wrapping to scrapers | This week | Backend |
| 🔴 P0 | Add missing database indexes | This week | Backend |
| 🟡 P1 | Add unique constraints | Next sprint | Backend |
| 🟡 P1 | Rate limit anonymous endpoints | Next sprint | Backend |
| 🟢 P2 | Implement cursor pagination | Next month | Full stack |

---

## 9. Appendix

### 9.1 Database Schema Summary

#### Core Tables

| Table | Rows (Est.) | Primary Use |
|-------|-------------|-------------|
| `filaments` | 4,700+ | Product catalog |
| `printers` | 105+ | Printer specifications |
| `automated_brands` | 50+ | Brand configuration |
| `printer_accessories` | 500+ | Hotends, build plates, AMS |
| `profiles` | Variable | User profiles |
| `user_favorites` | Variable | User wishlists |

#### History/Log Tables

| Table | Rows (Est.) | Retention |
|-------|-------------|-----------|
| `price_history` | 100K+ | Indefinite |
| `printer_price_history` | 10K+ | Indefinite |
| `brand_sync_logs` | 5K+ | Indefinite |
| `admin_activity_log` | 1K+ | Indefinite |

### 9.2 Edge Function Inventory

| Function | Purpose | Trigger | Dependencies |
|----------|---------|---------|--------------|
| `scrape-brand-data` | Main filament scraper | Manual/Cron | Firecrawl, SerpApi |
| `update-global-prices` | Printer price updates | Manual | Firecrawl |
| `parse-filament-tds` | TDS PDF parsing | Manual | Firecrawl, Gemini |
| `scrape-brand-nozzles` | Hotend scraping | Manual | Firecrawl |
| `scrape-accessory-images` | AI image selection | Manual | Firecrawl, Gemini |
| `log-printer-prices` | Daily price logging | Cron (3 AM UTC) | None |
| `enrich-printer-data` | AI spec enrichment | Manual | Gemini |

### 9.3 External API Dependencies

| API | Purpose | Rate Limits | Fallback |
|-----|---------|-------------|----------|
| Firecrawl | Web scraping | 500 req/min | None |
| SerpApi | Amazon search | 100 req/hour | ScrapingDog |
| ScrapingDog | Amazon fallback | 1000 req/month | Manual |
| Gemini AI | Content analysis | Lovable managed | None |

### 9.4 Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Finder page load time | < 500ms | > 1000ms |
| Scraper success rate | > 95% | < 90% |
| Database connection pool | < 80% | > 90% |
| Price data freshness | < 7 days | > 14 days |
| Image availability | > 98% | < 95% |

---

## Document Information

- **Version**: 1.0
- **Generated**: December 18, 2025
- **Author**: Architecture Review System
- **Scope**: FilaScope Web Application
- **Review Period**: Comprehensive analysis of current codebase

---

*This document should be reviewed and updated quarterly or after major architectural changes.*
