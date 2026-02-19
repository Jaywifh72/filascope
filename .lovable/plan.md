
## Root Cause Analysis: Why Polymaker Buy Links Have No Affiliate Parameters

This is NOT a missing infrastructure problem. The affiliate infrastructure is fully built. The issue is **missing configuration data** in the `affiliate_configs` table for most brands.

### What's Working Correctly
- `useAffiliateLinks` hook → `get-affiliate-url` edge function → `affiliate_configs` table ✅
- `useAffiliateLink` hook → `affiliate_programs` table (newer, more complete system) ✅
- Prusa/Prusament: Both tables configured, `#a_aid=Jay` applied correctly ✅
- Overture: `?aff=99` applied (via `affiliate_url_pattern` in `affiliate_configs`) ✅
- Amazon: Tags applied (amazon tags set in `affiliate_configs`) ✅

### What's Broken: Missing Config Data

**Polymaker** (`affiliate_configs` row):
- `affiliate_network` = `goaffpro` (correct network identified)
- `affiliate_id` = NULL ← **no ID configured**
- `affiliate_url_pattern` = NULL ← **no URL pattern set**
- Result: `transformUrl()` hits the `default` switch case, finds no pattern, returns URL unchanged

**Bambu Lab, Anycubic, Creality, eSUN, KingRoon** (in `affiliate_configs`):
- `affiliate_network` is set but `affiliate_id` is NULL and `affiliate_url_pattern` is NULL
- The `affiliate_programs` table HAS working configs for these (with `link_template`, `tracking_value`) but the **older** `useAffiliateLinks` hook (used by ~15 components) queries `affiliate_configs`, not `affiliate_programs`

### The Two-System Gap

There are **two parallel systems**:

```text
System A (newer, more complete):
  useAffiliateLink.ts → affiliate_programs table
  → Used by: FilamentPurchaseSidebar, MobileBottomBar, QuickSummaryBar,
             PrimaryBuyButton, FilamentHeroPurchaseCard, DealCard, StickyBuyBar

System B (older, less configured):
  useAffiliateLinks.ts → get-affiliate-url edge fn → affiliate_configs table
  → Used by: useFilamentDetailPricing, PurchaseSection, Compare page,
             MiniFilamentCard, HardwareTab, DealsModule, GroupedDealCard,
             useBestPrice, useFilamentListings
```

System A's `affiliate_programs` table has full working configs for Anycubic, Creality, eSUN, KingRoon, Overture, Proto-Pasta. But System B's `affiliate_configs` table only has working configs for Prusa, Prusament, and Overture (partially).

**Polymaker is in neither system with any working parameters.**

### The Fix: Data + Code

#### Part 1 — Update `affiliate_configs` table data (System B)

Populate the `affiliate_url_pattern` and `affiliate_id` columns for brands that already have working data in `affiliate_programs`. No schema changes needed.

| Brand | Network | Pattern to add | ID/value |
|---|---|---|---|
| Polymaker | goaffpro | `?sca_ref=PLACEHOLDER&sca_source=filascope` | `PLACEHOLDER` |
| Bambu Lab | awin | Use existing awin cols | already has awin cols |
| Anycubic | awin | Use existing awin cols | no awin IDs set |
| Creality | goaffpro | `?sca_ref=432793.sgEubTAk&source=filascope` | `432793.sgEubTAk` |

Since we have `awin_merchant_id` and `awin_publisher_id` already in `affiliate_programs` for eSUN (99267/2703056) and KingRoon (101327/2703056), we need to populate the `awin_advertiser_id` and `awin_affiliate_id` columns in `affiliate_configs` for those brands.

#### Part 2 — Bridge the two systems (Code change)

The real long-term fix is making System B (`useAffiliateLinks`) fall back to `affiliate_programs` when `affiliate_configs` has no pattern. This means updating `src/hooks/useAffiliateLinks.tsx` so `fetchConfigs()` also fetches from `affiliate_programs` and merges the richer data into its config cache.

However, the simpler immediate fix is to populate the `affiliate_configs` table with the data that already exists in `affiliate_programs`, then backfill Polymaker with a placeholder pattern that will immediately work once the real Polymaker GoAffPro ID is known.

#### Part 3 — Polymaker Specifically

Polymaker uses **GoAffPro**. The URL pattern for GoAffPro is:  
`https://shop.polymaker.com/products/panchroma-pla?sca_ref=ID&sca_source=filascope`

We'll add `affiliate_url_pattern = ?sca_ref=PLACEHOLDER&sca_source=filascope` and `affiliate_id = PLACEHOLDER` so the infrastructure is in place and visibly tagged (with `PLACEHOLDER` so it's obvious in links that the real ID needs substituting).

#### Part 4 — utm_source fallback

For any brand in `affiliate_configs` with `is_active = true` but no pattern, the `get-affiliate-url` edge function currently returns the URL unchanged. We should add a UTM fallback: always append `?utm_source=filascope&utm_medium=referral` if no affiliate tracking is applied. This ensures minimum tracking for all outbound links.

---

### Files to Change

**Data changes (via Supabase SQL, no schema migration needed):**
- `UPDATE affiliate_configs SET affiliate_url_pattern, affiliate_id` for Polymaker, Creality
- `UPDATE affiliate_configs SET awin_advertiser_id, awin_affiliate_id` for eSUN, KingRoon  
- `UPDATE affiliate_configs SET awin_advertiser_id, awin_affiliate_id` for Anycubic (pending IDs — use NULL for now, but note they are in `affiliate_programs` already)

**Code changes:**

1. **`supabase/functions/get-affiliate-url/index.ts`**  
   Add UTM fallback: when no affiliate transformation is applied (vendor found but no pattern/network match), append `?utm_source=filascope&utm_medium=referral` to the URL rather than returning it unchanged. This is a safety net for all brands.

2. **`src/hooks/useAffiliateLinks.tsx`** — Bridge to `affiliate_programs`  
   Modify `fetchConfigs()` to also query the `affiliate_programs` table directly (client-side via Supabase) for brands not covered by `affiliate_configs`. This bridges the gap between the two systems without rewriting the whole architecture. The merged config builds a unified pattern from `affiliate_programs` data (translating `link_generation_method: url_parameter` + `tracking_value` → an `affiliate_url_pattern` like `?ref=VALUE`).

### Implementation Sequence

1. Update data in `affiliate_configs` for brands with known tracking parameters
2. Update edge function with UTM fallback
3. Update `useAffiliateLinks` hook to bridge from `affiliate_programs`
4. Verify Polymaker link becomes `https://shop.polymaker.com/products/...?sca_ref=PLACEHOLDER&sca_source=filascope`

### What Will NOT Change

- No new tables (the user's request for `brand_affiliate_programs` — that table already exists as `affiliate_programs`)
- No schema migrations needed — only data updates
- No changes to `useAffiliateLink.ts` (System A, already working correctly)
- No changes to any UI components (they all correctly call the hooks)
- No changes to click tracking (already implemented in `affiliate_clicks` table + `trackAffiliateClick` functions)

### After This Fix

Every Polymaker buy link will become: `https://shop.polymaker.com/products/panchroma-pla?sca_ref=PLACEHOLDER&sca_source=filascope`

You'll just need to replace `PLACEHOLDER` with your real GoAffPro affiliate ID once you receive it from Polymaker's affiliate program. The infrastructure will be live immediately.
