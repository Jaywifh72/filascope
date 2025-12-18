# FilaScope Observability & Data Correctness Guide

**Version**: 1.0  
**Last Updated**: 2025-12-18  
**Author**: Staff Engineer Review  

---

## Table of Contents

1. [Instrumentation Plan](#1-instrumentation-plan)
2. [Data Correctness Test Plan](#2-data-correctness-test-plan)
3. [Invariants List](#3-invariants-list)
4. [Debug Playbook](#4-debug-playbook-top-10-incidents)
5. [Dashboards & Alerts](#5-dashboards--alerts)

---

## 1. Instrumentation Plan

### 1.1 Structured Logging Schema

All logs MUST follow this JSON structure:

```typescript
interface StructuredLog {
  timestamp: string;        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;          // e.g., 'scrape-brand-data', 'parse-filament-tds'
  event: string;            // Exact event name (see catalog below)
  trace_id?: string;        // For distributed tracing
  span_id?: string;
  duration_ms?: number;
  
  // Context fields
  brand_slug?: string;
  filament_id?: string;
  printer_id?: string;
  user_id?: string;
  
  // Error fields
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  
  // Business metrics
  items_processed?: number;
  items_failed?: number;
  data_enriched?: Record<string, number>;
}
```

### 1.2 Event Catalog

#### Scraper Events

| Event Name | Level | Key Fields | Description |
|------------|-------|------------|-------------|
| `scraper.started` | info | `brand_slug`, `platform_type`, `trace_id` | Scrape job initiated |
| `scraper.product_discovered` | debug | `brand_slug`, `product_url`, `product_title` | New product found |
| `scraper.product_created` | info | `brand_slug`, `filament_id`, `product_title` | New filament inserted |
| `scraper.product_updated` | info | `brand_slug`, `filament_id`, `fields_updated[]` | Existing filament modified |
| `scraper.product_skipped` | debug | `brand_slug`, `product_url`, `reason` | Product excluded (non-filament) |
| `scraper.price_changed` | info | `filament_id`, `old_price`, `new_price`, `percent_change` | Price update detected |
| `scraper.rate_limited` | warn | `brand_slug`, `retry_after_ms`, `attempt` | Rate limit hit |
| `scraper.fetch_failed` | error | `brand_slug`, `url`, `status_code`, `error_message` | HTTP request failed |
| `scraper.parse_failed` | error | `brand_slug`, `product_url`, `error_message` | Data extraction failed |
| `scraper.completed` | info | `brand_slug`, `duration_ms`, `products_created`, `products_updated`, `products_failed` | Scrape job finished |

#### TDS Parsing Events

| Event Name | Level | Key Fields | Description |
|------------|-------|------------|-------------|
| `tds.parse_started` | info | `filament_id`, `tds_url`, `trace_id` | TDS parsing initiated |
| `tds.pdf_fetched` | debug | `filament_id`, `content_length` | PDF content retrieved |
| `tds.ai_extraction_started` | debug | `filament_id`, `model` | AI processing began |
| `tds.specs_extracted` | info | `filament_id`, `fields_extracted[]`, `confidence_scores` | Specs successfully parsed |
| `tds.parse_failed` | error | `filament_id`, `tds_url`, `error_message` | TDS parsing failed |

#### API Events

| Event Name | Level | Key Fields | Description |
|------------|-------|------------|-------------|
| `api.request_received` | debug | `path`, `method`, `user_id`, `trace_id` | Incoming request |
| `api.auth_failed` | warn | `path`, `reason`, `ip_address` | Authentication failure |
| `api.admin_action` | info | `user_id`, `action_type`, `entity_type`, `entity_id` | Admin performed action |
| `api.response_sent` | debug | `path`, `status_code`, `duration_ms` | Response completed |

#### Data Quality Events

| Event Name | Level | Key Fields | Description |
|------------|-------|------------|-------------|
| `quality.stale_data_detected` | warn | `entity_type`, `entity_count`, `threshold_days` | Data exceeds freshness SLA |
| `quality.duplicate_detected` | warn | `entity_type`, `entity_id_a`, `entity_id_b`, `confidence` | Potential duplicate found |
| `quality.invariant_violation` | error | `invariant_name`, `entity_id`, `expected`, `actual` | Business rule violated |
| `quality.completeness_drop` | warn | `brand_slug`, `old_score`, `new_score`, `missing_fields[]` | Data quality regression |

### 1.3 Metrics to Collect

#### Counters

```typescript
// Scraper metrics
scraper_jobs_total{brand, platform, status}           // Total scrape jobs
scraper_products_processed_total{brand, operation}    // create/update/skip/fail
scraper_price_changes_total{brand, direction}         // up/down/unchanged
scraper_api_calls_total{brand, endpoint, status}      // External API calls

// Data quality metrics
data_quality_issues_total{type, severity}             // Validation failures
data_duplicates_total{entity_type, resolution}        // Duplicate handling

// User metrics
user_actions_total{action_type, entity_type}          // User interactions
```

#### Gauges

```typescript
// Scraper state
scraper_active_jobs{brand}                            // Currently running scrapes
scraper_queue_depth{priority}                         // Pending scrape jobs

// Data quality state
data_freshness_age_days{entity_type, brand}           // Days since last update
data_completeness_score{entity_type, brand}           // 0-100 completeness
data_stale_count{entity_type, threshold}              // Count of stale records

// Database state
filaments_total{brand, material}                      // Total filament count
printers_total{brand}                                 // Total printer count
```

#### Histograms

```typescript
// Latency distributions
scraper_duration_seconds{brand, platform}             // Scrape job duration
api_request_duration_seconds{path, method}            // API latency
tds_parse_duration_seconds{brand}                     // TDS processing time

// Size distributions
scraper_products_per_job{brand}                       // Products per scrape
api_response_size_bytes{path}                         // Response payload size
```

### 1.4 Implementation: Edge Function Logging

```typescript
// supabase/functions/_shared/logging.ts

interface LogContext {
  trace_id: string;
  span_id: string;
  service: string;
}

class StructuredLogger {
  private context: LogContext;
  
  constructor(service: string) {
    this.context = {
      trace_id: crypto.randomUUID(),
      span_id: crypto.randomUUID().slice(0, 8),
      service,
    };
  }

  private log(level: string, event: string, data: Record<string, unknown> = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      ...this.context,
      event,
      ...data,
    };
    console.log(JSON.stringify(entry));
  }

  info(event: string, data?: Record<string, unknown>) { this.log('info', event, data); }
  warn(event: string, data?: Record<string, unknown>) { this.log('warn', event, data); }
  error(event: string, data?: Record<string, unknown>) { this.log('error', event, data); }
  debug(event: string, data?: Record<string, unknown>) { this.log('debug', event, data); }

  // Create child span for nested operations
  span(operation: string): StructuredLogger {
    const child = new StructuredLogger(this.context.service);
    child.context.trace_id = this.context.trace_id;
    child.context.span_id = `${this.context.span_id}.${crypto.randomUUID().slice(0, 4)}`;
    return child;
  }

  // Measure operation duration
  async timed<T>(event: string, fn: () => Promise<T>, data?: Record<string, unknown>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(event, { ...data, duration_ms: Date.now() - start, status: 'success' });
      return result;
    } catch (error) {
      this.error(event, { 
        ...data, 
        duration_ms: Date.now() - start, 
        status: 'error',
        error_message: error.message 
      });
      throw error;
    }
  }
}

// Usage in scrape-brand-data
const logger = new StructuredLogger('scrape-brand-data');

logger.info('scraper.started', { brand_slug: 'polymaker', platform_type: 'shopify' });

const products = await logger.timed('scraper.fetch_products', async () => {
  return await fetchShopifyProducts(config);
}, { brand_slug: 'polymaker' });

logger.info('scraper.completed', {
  brand_slug: 'polymaker',
  products_created: 5,
  products_updated: 12,
  products_failed: 0,
});
```

### 1.5 Distributed Tracing

```typescript
// Pass trace context through edge function calls
const headers = new Headers(req.headers);
const traceId = headers.get('x-trace-id') || crypto.randomUUID();
const parentSpanId = headers.get('x-span-id');

// When calling another edge function
await fetch(`${SUPABASE_URL}/functions/v1/parse-filament-tds`, {
  headers: {
    'x-trace-id': traceId,
    'x-span-id': currentSpanId,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ filament_id }),
});
```

---

## 2. Data Correctness Test Plan

### 2.1 Unit Tests

#### Price Parsing Tests

```typescript
// __tests__/utils/parsePrice.test.ts
import { parsePrice } from '@/utils/parsePrice';

describe('parsePrice', () => {
  // Valid inputs
  test.each([
    ['$29.99', 29.99],
    ['29.99 USD', 29.99],
    ['€24,50', 24.50],
    ['£19.99', 19.99],
    ['¥2,980', 2980],
    ['CAD $34.99', 34.99],
  ])('parses "%s" to %f', (input, expected) => {
    expect(parsePrice(input)).toBeCloseTo(expected, 2);
  });

  // Invalid inputs
  test.each([
    [null, null],
    [undefined, null],
    ['', null],
    ['free', null],
    ['$0', null],           // Zero price invalid
    ['$10001', null],       // Price too high
    ['-$5.00', null],       // Negative price
    ['NaN', null],
  ])('returns null for invalid input "%s"', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  // Edge cases
  test('handles multiple decimal points', () => {
    expect(parsePrice('$29.99.99')).toBe(null);
  });

  test('extracts first valid price from string', () => {
    expect(parsePrice('Was $39.99, now $29.99')).toBeCloseTo(39.99, 2);
  });
});
```

#### Title Cleaning Tests

```typescript
// __tests__/utils/intelligentTitleClean.test.ts
import { intelligentTitleClean, extractDataFromTitle } from '@/utils/titleCleaning';

describe('intelligentTitleClean', () => {
  test.each([
    ['PLA Filament 1.75mm 1kg Black', 'PLA Black'],
    ['PETG 3D Printer Filament 1.75 mm 2.2lbs', 'PETG'],
    ['ABS+ (ABS Plus) Premium Filament', 'ABS+'],
    ['[Flash Sale] PLA Pro 1kg', 'PLA Pro'],
    ['Silk PLA - Gold Color 1.75mm/1KG', 'Silk PLA Gold'],
    ['PLA&#8211;Matte Black', 'PLA Matte Black'],  // HTML entity
  ])('cleans "%s" to "%s"', (input, expected) => {
    expect(intelligentTitleClean(input)).toBe(expected);
  });
});

describe('extractDataFromTitle', () => {
  test('extracts weight from title', () => {
    const result = extractDataFromTitle('PLA 3KG Black');
    expect(result.net_weight_g).toBe(3000);
  });

  test('extracts MOQ from brackets', () => {
    const result = extractDataFromTitle('PLA [MOQ: 6KG] Black');
    expect(result.pack_quantity).toBe(6);
  });

  test('extracts diameter', () => {
    const result = extractDataFromTitle('PLA 2.85mm Black');
    expect(result.diameter_mm).toBe(2.85);
  });
});
```

#### Color Extraction Tests

```typescript
// __tests__/utils/colorExtraction.test.ts
import { extractColorFromTitle, normalizeColorHex, colorDistance } from '@/utils/colorExtraction';

describe('extractColorFromTitle', () => {
  test.each([
    ['PLA Matte Black', { name: 'Black', hex: '#000000', family: 'Black' }],
    ['PETG Translucent Blue', { name: 'Translucent Blue', hex: '#4169E1', family: 'Blue' }],
    ['Silk Rainbow PLA', { name: 'Rainbow', hex: null, family: 'Rainbow' }],
    ['PLA #FF5733', { name: null, hex: '#FF5733', family: 'Orange' }],
  ])('extracts color from "%s"', (input, expected) => {
    const result = extractColorFromTitle(input);
    expect(result.name).toBe(expected.name);
    expect(result.hex).toBe(expected.hex);
    expect(result.family).toBe(expected.family);
  });
});

describe('colorDistance', () => {
  test('identical colors have zero distance', () => {
    expect(colorDistance('#FF0000', '#FF0000')).toBe(0);
  });

  test('similar colors have small distance', () => {
    const distance = colorDistance('#FF0000', '#FF1111');
    expect(distance).toBeLessThan(10);
  });

  test('opposite colors have large distance', () => {
    const distance = colorDistance('#FF0000', '#00FFFF');
    expect(distance).toBeGreaterThan(100);
  });
});
```

### 2.2 Integration Tests

#### Scraper → Database Flow

```typescript
// __tests__/integration/scraperFlow.test.ts
import { createClient } from '@supabase/supabase-js';
import { ShopifyScraper } from '@/scrapers/shopify';

describe('Scraper Integration', () => {
  const supabase = createClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  
  beforeEach(async () => {
    // Clean test data
    await supabase.from('filaments').delete().eq('vendor', 'TEST_VENDOR');
    await supabase.from('brand_sync_logs').delete().eq('brand_slug', 'test-brand');
  });

  test('scraper creates new filament with all fields', async () => {
    const scraper = new ShopifyScraper(testConfig);
    const mockProduct = createMockShopifyProduct();
    
    const result = await scraper.processProduct(mockProduct);
    
    // Verify database state
    const { data: filament } = await supabase
      .from('filaments')
      .select('*')
      .eq('product_id', mockProduct.id)
      .single();
    
    expect(filament).toBeDefined();
    expect(filament.product_title).toBe(mockProduct.title);
    expect(filament.variant_price).toBe(mockProduct.variants[0].price);
    expect(filament.featured_image).toBe(mockProduct.images[0].src);
    expect(filament.auto_created).toBe(true);
  });

  test('scraper updates existing filament without overwriting user fields', async () => {
    // Create filament with user override
    const { data: existing } = await supabase.from('filaments').insert({
      product_id: 'test-123',
      product_title: 'User Modified Title',
      vendor: 'TEST_VENDOR',
      user_override_fields: ['product_title'],
    }).select().single();

    const scraper = new ShopifyScraper(testConfig);
    await scraper.processProduct({
      id: 'test-123',
      title: 'New Scraped Title',
      // ... other fields
    });

    const { data: updated } = await supabase
      .from('filaments')
      .select('*')
      .eq('id', existing.id)
      .single();

    // User override should be preserved
    expect(updated.product_title).toBe('User Modified Title');
  });

  test('scraper logs sync results correctly', async () => {
    const scraper = new ShopifyScraper(testConfig);
    await scraper.scrapeAllProducts(5);

    const { data: syncLog } = await supabase
      .from('brand_sync_logs')
      .select('*')
      .eq('brand_slug', 'test-brand')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(syncLog.status).toBe('completed');
    expect(syncLog.products_discovered).toBeGreaterThan(0);
    expect(syncLog.duration_seconds).toBeGreaterThan(0);
  });
});
```

#### Price History Flow

```typescript
// __tests__/integration/priceHistory.test.ts
describe('Price History Integration', () => {
  test('price change triggers history record', async () => {
    const filamentId = await createTestFilament({ variant_price: 29.99 });
    
    // Update price
    await supabase
      .from('filaments')
      .update({ variant_price: 24.99 })
      .eq('id', filamentId);

    // Verify history record (via trigger)
    const { data: history } = await supabase
      .from('price_history')
      .select('*')
      .eq('filament_id', filamentId)
      .order('recorded_at', { ascending: false });

    expect(history).toHaveLength(2);
    expect(history[0].price).toBe(24.99);
    expect(history[1].price).toBe(29.99);
  });

  test('identical price does not create duplicate history', async () => {
    const filamentId = await createTestFilament({ variant_price: 29.99 });
    
    // Update with same price
    await supabase
      .from('filaments')
      .update({ variant_price: 29.99, updated_at: new Date().toISOString() })
      .eq('id', filamentId);

    const { data: history } = await supabase
      .from('price_history')
      .select('*')
      .eq('filament_id', filamentId);

    expect(history).toHaveLength(1);
  });
});
```

### 2.3 Contract Tests

#### Shopify API Contract

```typescript
// __tests__/contracts/shopifyApi.test.ts
import { z } from 'zod';

const ShopifyProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullable(),
  vendor: z.string(),
  product_type: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable(),
  images: z.array(z.object({
    id: z.number(),
    src: z.string().url(),
    alt: z.string().nullable(),
  })),
  variants: z.array(z.object({
    id: z.number(),
    title: z.string(),
    price: z.string(),
    compare_at_price: z.string().nullable(),
    sku: z.string().nullable(),
    barcode: z.string().nullable(),
    available: z.boolean(),
  })),
});

describe('Shopify API Contract', () => {
  const SHOPIFY_STORES = [
    'polymaker.myshopify.com',
    'us.store.bambulab.com',
    'store.prusa3d.com',
  ];

  test.each(SHOPIFY_STORES)('products from %s match schema', async (store) => {
    const response = await fetch(`https://${store}/products.json?limit=5`);
    const data = await response.json();
    
    for (const product of data.products) {
      const result = ShopifyProductSchema.safeParse(product);
      if (!result.success) {
        console.error(`Contract violation for ${store}:`, result.error.format());
      }
      expect(result.success).toBe(true);
    }
  });
});
```

#### Firecrawl API Contract

```typescript
// __tests__/contracts/firecrawlApi.test.ts
const FirecrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    content: z.string().optional(),
    markdown: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
    }).optional(),
    links: z.array(z.string()).optional(),
  }).optional(),
  error: z.string().optional(),
});

describe('Firecrawl API Contract', () => {
  test('scrape response matches schema', async () => {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.polymaker.com/products/polylite-pla',
        formats: ['markdown'],
      }),
    });
    
    const data = await response.json();
    const result = FirecrawlResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

### 2.4 Property-Based Tests

```typescript
// __tests__/properties/dataInvariants.test.ts
import fc from 'fast-check';

describe('Data Invariants (Property-Based)', () => {
  test('parsed prices are always positive', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const price = parsePrice(input);
        return price === null || price > 0;
      }),
      { numRuns: 1000 }
    );
  });

  test('cleaned titles are never empty for valid input', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        (input) => {
          const cleaned = intelligentTitleClean(input);
          return cleaned.length > 0;
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('color hex values are always valid 6-digit hex', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = extractColorFromTitle(input);
        if (result.hex === null) return true;
        return /^#[0-9A-Fa-f]{6}$/.test(result.hex);
      }),
      { numRuns: 1000 }
    );
  });

  test('true cost calculation is monotonic with weight', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10000 }),  // price
        fc.float({ min: 100, max: 10000 }),    // weight_g
        (price, weight) => {
          const trueCost = (price / weight) * 1000;  // per kg
          return trueCost > 0 && isFinite(trueCost);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
```

### 2.5 Migration Tests

```typescript
// __tests__/migrations/migrationSafety.test.ts
describe('Migration Safety', () => {
  test('new columns have safe defaults', async () => {
    // Run migration
    await applyMigration('add_new_column');
    
    // Insert row without new column
    const { data, error } = await supabase
      .from('filaments')
      .insert({ product_title: 'Test', vendor: 'Test' })
      .select();
    
    expect(error).toBeNull();
    expect(data[0].new_column).toBeDefined();  // Has default
  });

  test('migration is reversible', async () => {
    const beforeState = await getTableSchema('filaments');
    
    await applyMigration('modify_column');
    await rollbackMigration('modify_column');
    
    const afterState = await getTableSchema('filaments');
    expect(afterState).toEqual(beforeState);
  });

  test('data survives migration round-trip', async () => {
    const testData = await createTestFilament();
    
    await applyMigration('alter_column_type');
    
    const { data } = await supabase
      .from('filaments')
      .select('*')
      .eq('id', testData.id)
      .single();
    
    expect(data.product_title).toBe(testData.product_title);
    expect(data.variant_price).toBeCloseTo(testData.variant_price, 2);
  });
});
```

---

## 3. Invariants List

### 3.1 Business Invariants

| Invariant | Description | Enforcement Location |
|-----------|-------------|---------------------|
| `PRICE_POSITIVE` | All prices must be > 0 | DB CHECK, Edge Function |
| `PRICE_REASONABLE` | Prices must be < $10,000 | DB CHECK, Edge Function |
| `DIAMETER_VALID` | Diameter must be 1.75 or 2.85 mm | DB CHECK |
| `WEIGHT_POSITIVE` | Net weight must be > 0 when set | DB CHECK |
| `TEMPERATURE_RANGE` | Nozzle temp: 150-500°C, Bed: 0-150°C | DB CHECK |
| `HEX_FORMAT` | Color hex must match `#[0-9A-F]{6}` | DB CHECK, Frontend |
| `URL_VALID` | Product URLs must be valid HTTP(S) | Edge Function |
| `UNIQUE_PRODUCT_ID` | product_id + vendor is unique | DB UNIQUE |
| `USER_OWNS_DATA` | Users can only modify their own data | RLS Policy |
| `ADMIN_REQUIRED` | Admin actions require admin role | RLS Policy, Edge Function |

### 3.2 Database Constraints

```sql
-- Price constraints
ALTER TABLE filaments ADD CONSTRAINT chk_variant_price_positive 
  CHECK (variant_price IS NULL OR variant_price > 0);

ALTER TABLE filaments ADD CONSTRAINT chk_variant_price_reasonable 
  CHECK (variant_price IS NULL OR variant_price < 10000);

ALTER TABLE filaments ADD CONSTRAINT chk_compare_at_price_positive 
  CHECK (variant_compare_at_price IS NULL OR variant_compare_at_price > 0);

-- Diameter constraint
ALTER TABLE filaments ADD CONSTRAINT chk_diameter_valid 
  CHECK (diameter_nominal_mm IS NULL OR diameter_nominal_mm IN (1.75, 2.85));

-- Weight constraint
ALTER TABLE filaments ADD CONSTRAINT chk_weight_positive 
  CHECK (net_weight_g IS NULL OR net_weight_g > 0);

-- Temperature constraints
ALTER TABLE filaments ADD CONSTRAINT chk_nozzle_temp_range 
  CHECK (
    (nozzle_temp_min_c IS NULL OR nozzle_temp_min_c BETWEEN 150 AND 500) AND
    (nozzle_temp_max_c IS NULL OR nozzle_temp_max_c BETWEEN 150 AND 500)
  );

ALTER TABLE filaments ADD CONSTRAINT chk_bed_temp_range 
  CHECK (
    (bed_temp_min_c IS NULL OR bed_temp_min_c BETWEEN 0 AND 150) AND
    (bed_temp_max_c IS NULL OR bed_temp_max_c BETWEEN 0 AND 150)
  );

-- Color hex format (using trigger for complex validation)
CREATE OR REPLACE FUNCTION validate_color_hex()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.color_hex IS NOT NULL AND NEW.color_hex !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Invalid color hex format: %', NEW.color_hex;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_color_hex
  BEFORE INSERT OR UPDATE ON filaments
  FOR EACH ROW EXECUTE FUNCTION validate_color_hex();

-- Unique constraint
ALTER TABLE filaments ADD CONSTRAINT uq_product_vendor 
  UNIQUE (product_id, vendor);
```

### 3.3 Edge Function Validation

```typescript
// supabase/functions/_shared/validation.ts

import { z } from 'zod';

export const FilamentSchema = z.object({
  product_title: z.string().min(1).max(500),
  vendor: z.string().min(1).max(100),
  variant_price: z.number().positive().max(10000).nullable(),
  diameter_nominal_mm: z.enum(['1.75', '2.85']).nullable(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  product_url: z.string().url().nullable(),
  nozzle_temp_min_c: z.number().min(150).max(500).nullable(),
  nozzle_temp_max_c: z.number().min(150).max(500).nullable(),
  bed_temp_min_c: z.number().min(0).max(150).nullable(),
  bed_temp_max_c: z.number().min(0).max(150).nullable(),
});

export function validateFilament(data: unknown) {
  const result = FilamentSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid filament data', result.error.format());
  }
  return result.data;
}
```

### 3.4 Frontend Validation (React Hook Form + Zod)

```typescript
// src/lib/validations/filament.ts

export const filamentFormSchema = z.object({
  product_title: z.string().min(1, 'Title is required').max(500),
  variant_price: z.coerce.number().positive().max(10000).optional(),
  color_hex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
  nozzle_temp_min_c: z.coerce.number().min(150).max(500).optional(),
  nozzle_temp_max_c: z.coerce.number().min(150).max(500).optional(),
}).refine(
  data => !data.nozzle_temp_min_c || !data.nozzle_temp_max_c || 
          data.nozzle_temp_min_c <= data.nozzle_temp_max_c,
  { message: 'Min temp must be <= max temp', path: ['nozzle_temp_min_c'] }
);
```

---

## 4. Debug Playbook (Top 10 Incidents)

### 4.1 Stale Reads (TanStack Query Cache)

**Symptoms:**
- User sees outdated data after admin makes changes
- Prices don't update after scrape
- New filaments don't appear in listings

**Diagnosis:**
```typescript
// Check cache state in browser console
const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HANDLE__?.queryClient;
queryClient.getQueryCache().getAll().map(q => ({
  key: q.queryKey,
  state: q.state.status,
  staleTime: q.options.staleTime,
  dataUpdatedAt: new Date(q.state.dataUpdatedAt),
}));
```

**Resolution:**
```typescript
// Force invalidation
queryClient.invalidateQueries({ queryKey: ['filaments'] });

// Or with refetch
queryClient.refetchQueries({ queryKey: ['filaments'], type: 'active' });

// Nuclear option: clear all cache
queryClient.clear();
```

**Prevention:**
- Set appropriate `staleTime` (currently 5 minutes for most queries)
- Invalidate related queries after mutations
- Use `refetchOnWindowFocus` for critical data

---

### 4.2 Double Writes (Scraper Race Conditions)

**Symptoms:**
- Duplicate filaments with same product_id
- Sync logs show more `products_created` than expected
- Database constraint violations

**Diagnosis:**
```sql
-- Find duplicates
SELECT product_id, vendor, COUNT(*) 
FROM filaments 
GROUP BY product_id, vendor 
HAVING COUNT(*) > 1;

-- Check concurrent scrapes
SELECT brand_slug, started_at, status 
FROM brand_sync_logs 
WHERE started_at > NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC;
```

**Resolution:**
```sql
-- Remove duplicates (keep oldest)
DELETE FROM filaments f1
USING filaments f2
WHERE f1.product_id = f2.product_id 
  AND f1.vendor = f2.vendor
  AND f1.created_at > f2.created_at;

-- Add unique constraint if missing
ALTER TABLE filaments ADD CONSTRAINT uq_product_vendor 
  UNIQUE (product_id, vendor);
```

**Prevention:**
- Use `ON CONFLICT` for upserts
- Add scraping_active flag to prevent concurrent runs
- Implement distributed lock for critical sections

```typescript
// Check for active scrape before starting
const { data: brand } = await supabase
  .from('automated_brands')
  .select('scraping_active')
  .eq('brand_slug', brandSlug)
  .single();

if (brand.scraping_active) {
  throw new Error('Scrape already in progress');
}

// Set lock
await supabase
  .from('automated_brands')
  .update({ scraping_active: true })
  .eq('brand_slug', brandSlug);

try {
  // ... scrape logic
} finally {
  // Release lock
  await supabase
    .from('automated_brands')
    .update({ scraping_active: false })
    .eq('brand_slug', brandSlug);
}
```

---

### 4.3 Retry Storms (Firecrawl Rate Limiting)

**Symptoms:**
- Edge function timeouts
- 429 errors in logs
- Scrapes take hours instead of minutes

**Diagnosis:**
```sql
-- Check recent failures
SELECT 
  brand_slug,
  error_details->>'error_message' as error,
  COUNT(*) as count
FROM brand_sync_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY brand_slug, error_details->>'error_message'
ORDER BY count DESC;

-- Check scrape durations
SELECT brand_slug, AVG(duration_seconds) as avg_duration
FROM brand_sync_logs
WHERE status = 'completed'
GROUP BY brand_slug
ORDER BY avg_duration DESC;
```

**Resolution:**
```typescript
// Implement exponential backoff
async function fetchWithBackoff(url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await sleep(retryAfter * 1000 * Math.pow(2, attempt));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}
```

**Prevention:**
- Set rate_limit_ms per brand in config
- Use batch_size to limit concurrent requests
- Monitor daily API usage

---

### 4.4 Queue Backlog (Scrape Job Accumulation)

**Symptoms:**
- next_scrape_at dates far in the past
- product_discovery_queue has thousands of pending items
- Scheduled scrapes never complete

**Diagnosis:**
```sql
-- Check overdue scrapes
SELECT brand_slug, next_scrape_at, 
       EXTRACT(EPOCH FROM (NOW() - next_scrape_at))/3600 as hours_overdue
FROM automated_brands
WHERE scraping_enabled = true
  AND next_scrape_at < NOW()
ORDER BY next_scrape_at;

-- Check queue depth
SELECT status, COUNT(*) 
FROM product_discovery_queue 
GROUP BY status;

-- Check stuck jobs
SELECT * FROM product_discovery_queue
WHERE status = 'processing'
  AND last_attempt_at < NOW() - INTERVAL '1 hour';
```

**Resolution:**
```sql
-- Reset stuck jobs
UPDATE product_discovery_queue
SET status = 'pending', attempts = 0
WHERE status = 'processing'
  AND last_attempt_at < NOW() - INTERVAL '1 hour';

-- Reschedule overdue brands
UPDATE automated_brands
SET next_scrape_at = NOW() + (RANDOM() * INTERVAL '30 minutes')
WHERE next_scrape_at < NOW() - INTERVAL '24 hours';

-- Purge failed queue items
DELETE FROM product_discovery_queue
WHERE status = 'failed'
  AND attempts >= max_attempts;
```

**Prevention:**
- Set max_attempts limit
- Implement dead letter queue
- Alert when queue depth exceeds threshold

---

### 4.5 Cache Poisoning (Corrupted Product Data)

**Symptoms:**
- Filament cards show wrong images
- Prices display as $0 or negative
- Material types show as "undefined"

**Diagnosis:**
```sql
-- Find corrupted records
SELECT id, product_title, variant_price, featured_image, material
FROM filaments
WHERE variant_price <= 0
   OR featured_image LIKE '%undefined%'
   OR material IS NULL
   OR product_title LIKE '%undefined%';

-- Check recent updates
SELECT id, product_title, updated_at, auto_updated
FROM filaments
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

**Resolution:**
```sql
-- Fix specific corruption
UPDATE filaments
SET featured_image = NULL
WHERE featured_image LIKE '%undefined%';

-- Trigger re-scrape for corrupted items
UPDATE filaments
SET next_scrape_at = NOW()
WHERE variant_price <= 0;

-- Clear frontend cache
-- (Requires user action or deploy)
```

**Prevention:**
- Validate all scraped data before save
- Use transactions for multi-step updates
- Implement data_hash for change detection

---

### 4.6 Missing Price Updates (Hash Collision/Skip Logic)

**Symptoms:**
- Prices in database don't match vendor website
- price_history has gaps
- products_updated count is zero

**Diagnosis:**
```sql
-- Compare to recent history
SELECT f.id, f.product_title, f.variant_price as current,
       ph.price as historical, ph.recorded_at
FROM filaments f
JOIN price_history ph ON ph.filament_id = f.id
WHERE ph.recorded_at = (
  SELECT MAX(recorded_at) FROM price_history WHERE filament_id = f.id
)
AND f.variant_price != ph.price;

-- Check hash values
SELECT id, product_title, external_data_hash, last_scraped_at
FROM filaments
WHERE vendor = 'Polymaker'
ORDER BY last_scraped_at DESC;
```

**Resolution:**
```typescript
// Force update by clearing hash
await supabase
  .from('filaments')
  .update({ external_data_hash: null })
  .eq('vendor', 'Polymaker');

// Re-run scraper
```

**Prevention:**
- Include price in hash calculation
- Log skip reasons with details
- Periodic full refresh ignoring hash

---

### 4.7 Broken Affiliate Links

**Symptoms:**
- "View on Store" buttons lead to 404
- Amazon links redirect to homepage
- Affiliate revenue drops

**Diagnosis:**
```sql
-- Find broken URLs
SELECT id, product_title, product_url
FROM filaments
WHERE product_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 100;

-- Check with URL validation
SELECT * FROM url_validation_results
WHERE status_code >= 400
  AND checked_at > NOW() - INTERVAL '24 hours';
```

**Resolution:**
```typescript
// Batch URL validation
const filaments = await supabase
  .from('filaments')
  .select('id, product_url')
  .not('product_url', 'is', null);

for (const f of filaments) {
  const response = await fetch(f.product_url, { method: 'HEAD' });
  if (response.status >= 400) {
    await supabase
      .from('filaments')
      .update({ product_url: null })
      .eq('id', f.id);
  }
}
```

**Prevention:**
- Weekly URL health check job
- Monitor HTTP status in scraper logs
- Alert on high 404 rate

---

### 4.8 RLS Bypass Attempts

**Symptoms:**
- Unauthorized data modifications
- Anonymous users seeing private data
- Audit log shows suspicious patterns

**Diagnosis:**
```sql
-- Check auth logs
SELECT timestamp, event_message, metadata->>'path' as path,
       metadata->>'status' as status
FROM auth.audit_log_entries
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Check for policy violations
SELECT * FROM admin_activity_log
WHERE user_id NOT IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
)
AND action_type IN ('delete', 'update', 'scrape');
```

**Resolution:**
```sql
-- Review and fix RLS policies
-- Ensure all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Add missing policies
ALTER TABLE filaments ENABLE ROW LEVEL SECURITY;
```

**Prevention:**
- Regular RLS audit using supabase linter
- Log all admin actions
- Implement rate limiting on sensitive endpoints

---

### 4.9 Duplicate Filaments

**Symptoms:**
- Same product appears multiple times
- Comparison page shows duplicates
- Brand product counts inflated

**Diagnosis:**
```sql
-- Find exact duplicates
SELECT product_title, vendor, COUNT(*)
FROM filaments
GROUP BY product_title, vendor
HAVING COUNT(*) > 1;

-- Find fuzzy duplicates
SELECT a.id, a.product_title, b.id, b.product_title,
       similarity(a.product_title, b.product_title) as sim
FROM filaments a
JOIN filaments b ON a.vendor = b.vendor AND a.id < b.id
WHERE similarity(a.product_title, b.product_title) > 0.8;

-- Check duplicate_candidates table
SELECT * FROM duplicate_candidates
WHERE resolved = false
ORDER BY confidence DESC;
```

**Resolution:**
```sql
-- Mark as duplicate candidates
INSERT INTO duplicate_candidates (entity_type, entity_id_a, entity_id_b, confidence, match_reason)
SELECT 'filament', a.id, b.id, 'high', 'Title similarity > 90%'
FROM filaments a
JOIN filaments b ON a.vendor = b.vendor AND a.id < b.id
WHERE similarity(a.product_title, b.product_title) > 0.9;

-- Admin review and merge
```

**Prevention:**
- Run duplicate detection after each scrape
- Implement product_id normalization
- Add fuzzy matching before insert

---

### 4.10 Currency Conversion Errors

**Symptoms:**
- Prices show as $0.02 (cent vs dollar confusion)
- EUR prices doubled or halved
- Regional prices wildly inaccurate

**Diagnosis:**
```sql
-- Find suspicious prices
SELECT id, product_title, variant_price, vendor
FROM filaments
WHERE variant_price < 1 OR variant_price > 500
ORDER BY variant_price;

-- Check conversion rates used
SELECT DISTINCT 
  brand_slug,
  success_details->>'currency' as source_currency,
  success_details->>'exchange_rate' as rate
FROM brand_sync_logs
WHERE success_details->>'currency' IS NOT NULL;
```

**Resolution:**
```typescript
// Validate conversion
function convertToUSD(price: number, currency: string): number {
  const rates: Record<string, number> = {
    'EUR': 1.10,
    'GBP': 1.27,
    'CAD': 0.74,
    'AUD': 0.66,
    'JPY': 0.0067,
  };
  
  const rate = rates[currency] || 1;
  const converted = price * rate;
  
  // Sanity check
  if (converted < 1 || converted > 500) {
    logger.warn('suspicious_conversion', { price, currency, converted });
    return null;  // Don't save suspicious values
  }
  
  return Math.round(converted * 100) / 100;
}
```

**Prevention:**
- Use reliable exchange rate API
- Validate converted prices against expected ranges
- Log original and converted values for audit

---

## 5. Dashboards & Alerts

### 5.1 Scraper Health Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ SCRAPER HEALTH                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Success Rate (24h)     Jobs Running      Queue Depth           │
│  ████████░░ 87%         ▲ 3               ⚠ 127                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Jobs by Status (24h)                                             │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ completed  ████████████████████████████████  156         │    │
│ │ failed     ████████                          23          │    │
│ │ running    ██                                3           │    │
│ └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Avg Duration by Platform                                         │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ shopify    ███████████                      45s          │    │
│ │ woocommerce ████████████████                72s          │    │
│ │ firecrawl  ██████████████████████████████   180s         │    │
│ │ amazon     ████████████████████████         120s         │    │
│ └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Error Breakdown                                                  │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ rate_limited     ████████████████  12                    │    │
│ │ timeout          ████████          6                     │    │
│ │ parse_error      ████              3                     │    │
│ │ auth_failed      ██                2                     │    │
│ └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**SQL Queries:**

```sql
-- Success rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE status = 'running') as running,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM brand_sync_logs
WHERE started_at > NOW() - INTERVAL '24 hours';

-- Duration by platform
SELECT 
  ab.platform_type,
  AVG(bsl.duration_seconds) as avg_duration
FROM brand_sync_logs bsl
JOIN automated_brands ab ON ab.brand_slug = bsl.brand_slug
WHERE bsl.started_at > NOW() - INTERVAL '24 hours'
GROUP BY ab.platform_type;

-- Error breakdown
SELECT 
  error_details->>'error_code' as error_type,
  COUNT(*) as count
FROM brand_sync_logs
WHERE status = 'failed'
  AND started_at > NOW() - INTERVAL '24 hours'
GROUP BY error_details->>'error_code'
ORDER BY count DESC;
```

### 5.2 Data Quality Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ DATA QUALITY                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall Score      Stale Records       Missing Data            │
│  ████████░░ 82%     ⚠ 234 (>30 days)    ⚠ 1,847                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Completeness by Field                                            │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ product_title    ██████████████████████████████  100%    │    │
│ │ variant_price    ███████████████████████████     92%     │    │
│ │ featured_image   ████████████████████████        84%     │    │
│ │ material         ███████████████████████         78%     │    │
│ │ color_hex        ████████████████                56%     │    │
│ │ tds_url          ██████████                      34%     │    │
│ │ nozzle_temps     ████████                        28%     │    │
│ └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Freshness by Brand (Top 10 Stale)                               │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ Brand              Last Scrape    Products    Status     │    │
│ │ GEEETECH           45 days ago    127         ⚠ STALE   │    │
│ │ TECBEARS           32 days ago    89          ⚠ STALE   │    │
│ │ Anycubic           12 days ago    234         ✓ OK      │    │
│ └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Duplicate Candidates                                             │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ Confidence    Count    Action Required                   │    │
│ │ High          23       Review and merge                  │    │
│ │ Medium        67       Manual verification               │    │
│ │ Low           145      Auto-ignore                       │    │
│ └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**SQL Queries:**

```sql
-- Overall completeness score
SELECT 
  AVG(
    (CASE WHEN variant_price IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN featured_image IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN material IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN color_hex IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN tds_url IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN nozzle_temp_min_c IS NOT NULL THEN 1 ELSE 0 END) / 6.0
  ) * 100 as overall_score
FROM filaments;

-- Completeness by field
SELECT 
  'variant_price' as field,
  COUNT(*) FILTER (WHERE variant_price IS NOT NULL) * 100.0 / COUNT(*) as pct
FROM filaments
UNION ALL
SELECT 
  'featured_image',
  COUNT(*) FILTER (WHERE featured_image IS NOT NULL) * 100.0 / COUNT(*)
FROM filaments
-- ... repeat for other fields

-- Stale brands
SELECT 
  vendor,
  MAX(last_scraped_at) as last_scrape,
  COUNT(*) as product_count,
  EXTRACT(DAY FROM NOW() - MAX(last_scraped_at)) as days_stale
FROM filaments
GROUP BY vendor
HAVING MAX(last_scraped_at) < NOW() - INTERVAL '30 days'
ORDER BY days_stale DESC;
```

### 5.3 Alert Configuration

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| `scraper_failure_rate_high` | Failure rate > 20% in 1h | Critical | PagerDuty |
| `scraper_stuck` | Same brand running > 30min | Warning | Slack |
| `queue_backlog_critical` | Queue depth > 500 | Critical | PagerDuty |
| `data_staleness_critical` | >50 brands stale >7 days | Warning | Email |
| `price_anomaly` | Price change > 50% | Warning | Slack |
| `duplicate_spike` | >100 new duplicates/day | Info | Dashboard |
| `rls_violation` | Any RLS bypass attempt | Critical | PagerDuty |
| `api_error_rate` | 5xx rate > 5% in 5min | Critical | PagerDuty |
| `edge_function_timeout` | Timeout rate > 10% | Warning | Slack |
| `completeness_regression` | Score drops >5% in 24h | Warning | Email |

### 5.4 Implementation: Alert Queries

```sql
-- scraper_failure_rate_high
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / NULLIF(COUNT(*), 0) as failure_rate
FROM brand_sync_logs
WHERE started_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) > 10  -- Minimum sample size
   AND COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) > 20;

-- queue_backlog_critical  
SELECT COUNT(*) as queue_depth
FROM product_discovery_queue
WHERE status = 'pending'
HAVING COUNT(*) > 500;

-- price_anomaly
SELECT 
  f.id,
  f.product_title,
  ph_old.price as old_price,
  ph_new.price as new_price,
  ABS(ph_new.price - ph_old.price) / ph_old.price * 100 as pct_change
FROM filaments f
JOIN price_history ph_new ON ph_new.filament_id = f.id
JOIN price_history ph_old ON ph_old.filament_id = f.id
WHERE ph_new.recorded_at > NOW() - INTERVAL '24 hours'
  AND ph_old.recorded_at < ph_new.recorded_at
  AND ph_old.recorded_at > NOW() - INTERVAL '48 hours'
  AND ABS(ph_new.price - ph_old.price) / ph_old.price > 0.5;

-- completeness_regression
WITH daily_scores AS (
  SELECT 
    DATE(updated_at) as day,
    AVG(
      (CASE WHEN variant_price IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN featured_image IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN material IS NOT NULL THEN 1 ELSE 0 END) / 3.0
    ) * 100 as score
  FROM filaments
  WHERE updated_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(updated_at)
)
SELECT 
  today.score as current_score,
  yesterday.score as previous_score,
  today.score - yesterday.score as delta
FROM daily_scores today
JOIN daily_scores yesterday ON yesterday.day = today.day - INTERVAL '1 day'
WHERE today.day = CURRENT_DATE
  AND today.score - yesterday.score < -5;
```

### 5.5 Supabase Analytics Queries (Built-in Logs)

```sql
-- Edge function error rate
SELECT 
  m.function_id,
  COUNT(*) FILTER (WHERE response.status_code >= 500) * 100.0 / COUNT(*) as error_rate
FROM function_edge_logs
CROSS JOIN UNNEST(metadata) as m
CROSS JOIN UNNEST(m.response) as response
WHERE function_edge_logs.timestamp > NOW() - INTERVAL '5 minutes'
GROUP BY m.function_id
HAVING COUNT(*) > 10;

-- Auth failures
SELECT 
  metadata.path,
  COUNT(*) as failure_count
FROM auth_logs
CROSS JOIN UNNEST(metadata) as metadata
WHERE auth_logs.timestamp > NOW() - INTERVAL '1 hour'
  AND metadata.status >= 400
GROUP BY metadata.path
ORDER BY failure_count DESC;

-- Database errors
SELECT 
  parsed.error_severity,
  COUNT(*) as count
FROM postgres_logs
CROSS JOIN UNNEST(metadata) as m
CROSS JOIN UNNEST(m.parsed) as parsed
WHERE postgres_logs.timestamp > NOW() - INTERVAL '1 hour'
  AND parsed.error_severity IN ('ERROR', 'FATAL')
GROUP BY parsed.error_severity;
```

---

## Appendix A: Quick Reference

### Log Levels
- **debug**: Verbose development info (scraper product details)
- **info**: Normal operations (job start/complete, record created)
- **warn**: Recoverable issues (rate limit, validation warning)
- **error**: Failures requiring attention (parse error, API failure)
- **fatal**: System-wide failures (database connection lost)

### Event Naming Convention
```
{domain}.{action}_{status?}

Examples:
- scraper.started
- scraper.product_created
- scraper.fetch_failed
- tds.parse_completed
- api.auth_failed
```

### Key Metric Prefixes
```
scraper_*    - Scraping operations
data_*       - Data quality metrics
api_*        - API/Edge function metrics
user_*       - User behavior metrics
```

---

## Appendix B: Monitoring Stack Recommendations

### Lightweight (Current Architecture)
- **Logs**: Supabase Analytics (postgres_logs, function_edge_logs)
- **Metrics**: Custom tables (sync_logs, scheduled_task_runs)
- **Alerts**: GitHub Actions + Supabase Edge Functions

### Production Scale
- **Logs**: Datadog / Grafana Loki
- **Metrics**: Prometheus + Grafana
- **Traces**: Jaeger / Datadog APM
- **Alerts**: PagerDuty / OpsGenie

---

*Document Version: 1.0 | Last Updated: 2025-12-18*
