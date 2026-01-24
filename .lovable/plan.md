

# Regional Store System - Database Infrastructure Plan

## Overview

This plan establishes the database foundation for FilaScope's multi-regional pricing system. The system will track which brands have stores in which regions, manage currency exchange rates, and store user region preferences.

## Current State Analysis

The codebase currently handles regional pricing through:
- **Client-side URL transformation**: `src/lib/brandRegionalStores.ts` contains a hardcoded `BRAND_REGIONAL_STORES` config for ~60+ brands
- **Filaments table**: Already has regional columns (`price_cad`, `price_eur`, `price_gbp`, `price_aud`, `price_jpy`, `product_url_ca`, `product_url_uk`, etc.)
- **Currency system**: `src/hooks/useCurrency.tsx` manages currency selection with hardcoded exchange rates
- **Regional price hook**: `src/hooks/useRegionalPrice.ts` handles fallback logic and price display
- **Profiles table**: Already has `preferred_currency` and `shipping_country` columns

The proposed database tables will replace the hardcoded configurations and enable dynamic management of regional stores.

---

## Phase 1: Database Tables

### Table 1: brand_regional_stores

Links brands to their regional storefronts with shipping and pricing configuration.

**Schema:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| brand_id | uuid | FK to automated_brands(id), NOT NULL | Brand reference |
| region_code | text | NOT NULL | Region: US, CA, UK, EU, AU, JP, CN |
| store_name | text | NOT NULL | Display name (e.g., "Creality Canada") |
| base_url | text | NOT NULL | Store base URL |
| product_url_pattern | text | nullable | URL pattern with {sku} placeholder |
| currency_code | text | NOT NULL | ISO 4217 currency code |
| ships_from_country | text | nullable | ISO country code for shipping origin |
| free_shipping_threshold | decimal(10,2) | nullable | Min order for free shipping |
| estimated_shipping_days | integer | nullable | Typical shipping time |
| is_primary | boolean | default false | Brand's flagship store |
| is_active | boolean | default true | Whether store is currently active |
| notes | text | nullable | Internal notes |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

**Constraints:**
- UNIQUE(brand_id, region_code)
- FK: brand_id → automated_brands(id) ON DELETE CASCADE

**Indexes:**
- idx_brand_regional_stores_brand_id
- idx_brand_regional_stores_region
- idx_brand_regional_stores_active (partial: WHERE is_active = true)

---

### Table 2: currency_exchange_rates

Stores exchange rates for currency conversion, updateable via API or manually.

**Schema:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| base_currency | text | NOT NULL, default 'USD' | Always USD |
| target_currency | text | NOT NULL | Target currency code |
| rate | decimal(12,6) | NOT NULL, CHECK > 0 | Multiply USD by this |
| inverse_rate | decimal(12,6) | NOT NULL, CHECK > 0 | Multiply target to get USD |
| source | text | default 'manual' | Data source identifier |
| fetched_at | timestamptz | default now() | When rate was fetched |
| created_at | timestamptz | default now() | |

**Constraints:**
- UNIQUE(base_currency, target_currency)
- CHECK(rate > 0)
- CHECK(inverse_rate > 0)

---

### Table 3: user_region_preferences

Stores user/session region and currency preferences for personalization.

**Schema:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| user_id | uuid | nullable | Authenticated user reference |
| session_id | text | nullable | For anonymous users |
| region_code | text | NOT NULL | User's preferred region |
| currency_code | text | NOT NULL | User's preferred currency |
| detected_method | text | default 'manual' | How preference was set |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

**Constraints:**
- CHECK: either user_id OR session_id must be set

---

## Phase 2: Row Level Security (RLS)

### brand_regional_stores
```sql
-- Public read access (store info is public)
CREATE POLICY "Allow public read" 
  ON brand_regional_stores FOR SELECT 
  USING (true);

-- Authenticated users can modify (admins only in practice)
CREATE POLICY "Allow authenticated write" 
  ON brand_regional_stores FOR ALL 
  USING (auth.role() = 'authenticated');
```

### currency_exchange_rates
```sql
-- Public read access (rates are public)
CREATE POLICY "Allow public read" 
  ON currency_exchange_rates FOR SELECT 
  USING (true);

-- Only service role can write (for automated updates)
CREATE POLICY "Allow service role write" 
  ON currency_exchange_rates FOR ALL 
  USING (auth.role() = 'service_role');
```

### user_region_preferences
```sql
-- Users can read their own preferences or anonymous session data
CREATE POLICY "Users can read own preferences" 
  ON user_region_preferences FOR SELECT 
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Anyone can insert (for anonymous users)
CREATE POLICY "Users can insert preferences" 
  ON user_region_preferences FOR INSERT 
  WITH CHECK (true);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" 
  ON user_region_preferences FOR UPDATE 
  USING (auth.uid() = user_id OR session_id IS NOT NULL);
```

---

## Phase 3: TypeScript Types

Create `src/types/regional.ts` with comprehensive type definitions:

```text
src/types/regional.ts
├── RegionCode (union type: 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP' | 'CN')
├── CurrencyCode (extends existing with additional currencies)
├── BrandRegionalStore (interface for brand_regional_stores row)
├── CurrencyExchangeRate (interface for currency_exchange_rates row)
├── UserRegionPreference (interface for user_region_preferences row)
├── RegionConfig (static config for region metadata)
├── CurrencyConfig (static config for currency formatting)
└── RegionalPriceResult (result type for price resolution)
```

---

## Phase 4: Seed Data

### Exchange Rates (Initial Values)
Insert approximate exchange rates for all supported currencies:
- USD → CAD: 1.36
- USD → EUR: 0.92
- USD → GBP: 0.79
- USD → AUD: 1.53
- USD → JPY: 149.50
- USD → CNY: 7.24
- USD → CHF: 0.88
- USD → SEK: 10.45
- USD → KRW: 1320.00
- USD → INR: 83.12

---

## Phase 5: Database Triggers

### Auto-update timestamps
```sql
CREATE TRIGGER update_brand_regional_stores_updated_at
  BEFORE UPDATE ON brand_regional_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_region_preferences_updated_at
  BEFORE UPDATE ON user_region_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Implementation Steps

1. **Create migration SQL** with all three tables, constraints, indexes
2. **Enable RLS** on all tables with appropriate policies
3. **Add triggers** for updated_at automation
4. **Insert seed data** for exchange rates
5. **Create TypeScript types** file at `src/types/regional.ts`
6. **Supabase types regeneration** will happen automatically

---

## Technical Considerations

### Foreign Key Reference
- Uses `automated_brands` table (not a separate `brands` table) since that's where filament brands are stored
- The `automated_brands.id` column is UUID type and exists with proper data

### Compatibility with Existing System
- The new tables complement the existing `filaments` regional columns
- The existing `useCurrency` hook can be updated to fetch rates from `currency_exchange_rates`
- The hardcoded `BRAND_REGIONAL_STORES` in `brandRegionalStores.ts` can eventually be replaced by queries to `brand_regional_stores`

### User Preferences Integration
- The `profiles` table already has `preferred_currency` - the new `user_region_preferences` handles anonymous users and adds region tracking
- Session-based preferences enable personalization without login

