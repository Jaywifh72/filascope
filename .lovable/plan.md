

## Plan: Complete FormFutura Sync (Remaining 47 URLs)

Since all 33 attempted URLs succeeded with zero errors, no code fixes are needed. The only issue is the edge function timeout — 47 URLs remain unprocessed.

### Actions

**1. Trigger a second sync pass**
Call `sync-prices` again with `{ "brand": "FormFutura", "region": "EU", "force": true, "useRegionalUrls": true }`. The URL dedup cache and the fact that already-synced URLs have recent `last_sync_at` timestamps means the function should skip completed ones and pick up where it left off, processing the next batch of ~33 URLs.

**2. Trigger a third sync pass (if needed)**
If the second pass doesn't complete all 47 remaining, run one more pass. With 600ms delays, 47 URLs need ~28 seconds of fetch time plus processing — it should fit in one pass.

**3. Verify final state**
After all passes complete, re-run the audit queries to confirm:
- `has_eur_price` count is close to 460 (some products may be genuinely unavailable/404)
- `stale_count` drops to near 0
- All 80 regional URL rows have a corresponding `product_regional_prices` entry

### Technical Detail
No file changes needed. The existing `sync-prices` edge function already has:
- EUR-only brand routing for FormFutura
- URL deduplication cache
- Correct `price_eur` column targeting
- `sync_status = 'active'` marking

This is purely an operational task — re-invoke the function to process the remaining batch.

