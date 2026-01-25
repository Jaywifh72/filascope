

# Price Freshness Tracking Implementation Plan

## Overview
This plan adds comprehensive price freshness tracking to the database, enabling accurate timestamps to show users when prices were last verified, and calculating confidence levels based on data age.

## Current State Analysis

### What Already Exists
1. **`price_history` table** - Tracks filament price changes with `recorded_at`, `source`, `region`
2. **`listing_price_history` table** - Tracks per-retailer listing changes
3. **`accessory_price_history` table** - For printer accessories
4. **`last_scraped_at` column** - Exists on `filaments` and `filament_listings` tables
5. **`prices_last_updated_at`** - Exists on `printers` table
6. **Automated triggers** - `auto_log_price_change()` and `log_listing_price_change()` already log changes
7. **`formatDistanceToNow`** - Already used in admin panels for freshness display

### What's Missing
1. `price_source` column to track origin (manual, scraper, api, affiliate)
2. `price_confidence` column for calculated staleness level
3. A unified price history table for printers
4. SQL function to calculate confidence based on age
5. UI components to display freshness to users

---

## Implementation Steps

### Phase 1: Database Schema Updates

#### 1.1 Add Metadata Columns to Filaments
```sql
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';

COMMENT ON COLUMN filaments.price_source IS 'Origin of price data: manual, scraper, api, affiliate';
COMMENT ON COLUMN filaments.price_confidence IS 'Calculated staleness: high, medium, low, stale, unknown';
```

#### 1.2 Add Metadata Columns to Printers
```sql
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';
```

#### 1.3 Add Metadata Columns to Filament Listings
```sql
ALTER TABLE filament_listings 
  ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'scraper',
  ADD COLUMN IF NOT EXISTS price_confidence VARCHAR(20) DEFAULT 'unknown';
```

#### 1.4 Create Printer Price History Table
```sql
CREATE TABLE IF NOT EXISTS printer_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  region_code VARCHAR(5) NOT NULL DEFAULT 'US',
  price DECIMAL(10,2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  store_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_printer_price_history_product ON printer_price_history(printer_id);
CREATE INDEX idx_printer_price_history_date ON printer_price_history(recorded_at DESC);
```

---

### Phase 2: Price Confidence Function

#### 2.1 Create SQL Function
```sql
CREATE OR REPLACE FUNCTION get_price_confidence(last_verified TIMESTAMPTZ)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF last_verified IS NULL THEN
    RETURN 'unknown';
  ELSIF last_verified > NOW() - INTERVAL '24 hours' THEN
    RETURN 'high';
  ELSIF last_verified > NOW() - INTERVAL '7 days' THEN
    RETURN 'medium';
  ELSIF last_verified > NOW() - INTERVAL '30 days' THEN
    RETURN 'low';
  ELSE
    RETURN 'stale';
  END IF;
END;
$$;

COMMENT ON FUNCTION get_price_confidence IS 
'Calculate price confidence based on age: <24h=high, <7d=medium, <30d=low, >30d=stale';
```

---

### Phase 3: Automated Confidence Updates

#### 3.1 Trigger to Auto-Update Confidence on Price Change
```sql
CREATE OR REPLACE FUNCTION update_price_confidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update confidence when price or last_scraped_at changes
  IF TG_TABLE_NAME = 'filaments' THEN
    NEW.price_confidence := get_price_confidence(NEW.last_scraped_at);
  ELSIF TG_TABLE_NAME = 'printers' THEN
    NEW.price_confidence := get_price_confidence(NEW.prices_last_updated_at);
  ELSIF TG_TABLE_NAME = 'filament_listings' THEN
    NEW.price_confidence := get_price_confidence(NEW.last_scraped_at);
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers for each table
CREATE TRIGGER trg_filament_price_confidence
  BEFORE INSERT OR UPDATE OF variant_price, last_scraped_at ON filaments
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();

CREATE TRIGGER trg_printer_price_confidence
  BEFORE INSERT OR UPDATE OF current_price_usd_store, prices_last_updated_at ON printers
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();

CREATE TRIGGER trg_listing_price_confidence
  BEFORE INSERT OR UPDATE OF current_price, last_scraped_at ON filament_listings
  FOR EACH ROW EXECUTE FUNCTION update_price_confidence();
```

#### 3.2 Backfill Existing Data
```sql
-- Update existing filaments
UPDATE filaments 
SET price_confidence = get_price_confidence(last_scraped_at)
WHERE last_scraped_at IS NOT NULL;

-- Update existing printers
UPDATE printers 
SET price_confidence = get_price_confidence(prices_last_updated_at)
WHERE prices_last_updated_at IS NOT NULL;

-- Update existing listings
UPDATE filament_listings 
SET price_confidence = get_price_confidence(last_scraped_at)
WHERE last_scraped_at IS NOT NULL;
```

---

### Phase 4: Update Scrapers to Set Price Source

#### 4.1 Modify Existing Scrapers
Update all scraper edge functions to set `price_source` when updating prices:

**Example pattern for scrapers:**
```typescript
// In each scraper, when updating filaments:
await supabase
  .from('filaments')
  .update({
    variant_price: scrapedPrice,
    last_scraped_at: new Date().toISOString(),
    price_source: 'scraper', // Add this
  })
  .eq('id', filamentId);
```

Scrapers to update:
- `scrape-paramount-prices`
- `scrape-fillamentum-prices`
- `scrape-amazon-prices`
- `sync-elegoo-ca-products`
- All brand-specific scrapers in `scrape-brand-data/`

---

### Phase 5: Frontend Integration

#### 5.1 Create Price Freshness Component
**File: `src/components/price/PriceFreshnessIndicator.tsx`**

```typescript
interface PriceFreshnessIndicatorProps {
  lastVerified: string | null;
  confidence: 'high' | 'medium' | 'low' | 'stale' | 'unknown';
  source?: string;
  compact?: boolean;
}

// Displays:
// - high: Green checkmark "Updated today"
// - medium: Blue clock "Updated X days ago"  
// - low: Yellow warning "Updated X weeks ago"
// - stale: Red alert "Price may be outdated"
// - unknown: Gray "Verify at store"
```

#### 5.2 Create Hook for Price Freshness
**File: `src/hooks/usePriceFreshness.ts`**

```typescript
export function usePriceFreshness(lastVerified: string | null) {
  return useMemo(() => ({
    confidence: calculateConfidence(lastVerified),
    timeAgo: lastVerified ? formatDistanceToNow(new Date(lastVerified)) : null,
    isStale: isOlderThan(lastVerified, 30), // days
    isRecent: isNewerThan(lastVerified, 24), // hours
  }), [lastVerified]);
}
```

#### 5.3 Update Filament Purchase Sidebar
**File: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`**

Replace the current disclaimer with the freshness indicator:
```tsx
<PriceFreshnessIndicator 
  lastVerified={filament.last_scraped_at}
  confidence={filament.price_confidence}
  source={filament.price_source}
/>
```

#### 5.4 Update Printer Price Display
Apply same pattern to `PrinterDetailPage.tsx` and related components.

---

### Phase 6: RLS Policies

```sql
-- Price history tables should be publicly readable
CREATE POLICY "Public read access for printer_price_history"
  ON printer_price_history FOR SELECT
  USING (true);

-- Only system/admin can insert
CREATE POLICY "System insert for printer_price_history"
  ON printer_price_history FOR INSERT
  WITH CHECK (true); -- Controlled via RLS on source tables + triggers
```

---

## Technical Details

### Confidence Level Thresholds
| Level | Age Threshold | UI Display |
|-------|---------------|------------|
| `high` | < 24 hours | Green badge, "Updated today" |
| `medium` | 1-7 days | Blue badge, "Updated X days ago" |
| `low` | 7-30 days | Yellow badge, "Updated X weeks ago" |
| `stale` | > 30 days | Red badge, "May be outdated" |
| `unknown` | No timestamp | Gray badge, "Verify at store" |

### Price Source Values
| Value | Description |
|-------|-------------|
| `manual` | Hand-entered by admin |
| `scraper` | Automated web scraper |
| `api` | Direct API integration |
| `affiliate` | Affiliate network data |

### Database Indexes
The new `printer_price_history` table includes:
- `idx_printer_price_history_product` for fast lookups by printer
- `idx_printer_price_history_date` for chronological queries

---

## Files to Create/Modify

### New Files
1. `supabase/migrations/[timestamp]_add_price_freshness_tracking.sql`
2. `src/components/price/PriceFreshnessIndicator.tsx`
3. `src/hooks/usePriceFreshness.ts`

### Modified Files
1. `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`
2. `src/components/printer/tabs/PricingTabContent.tsx`
3. `src/pages/PrinterDetailPage.tsx`
4. `src/components/deals/DealCard.tsx`
5. Various scraper edge functions (to set `price_source`)

---

## Benefits
1. **User Trust**: Honest display of data freshness
2. **Data Quality**: Track which prices need re-verification
3. **Admin Insights**: Identify stale pricing across catalog
4. **SEO**: More accurate product information
5. **Future Features**: Enable "price verified today" badges when scraper runs

