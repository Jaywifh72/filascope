

# Fix Auto-Heal URL Resolution for Mismatched Product URLs

## Problem Summary

The 404 auto-resolution fails because:
1. Frontend sends a **constructed regional URL** (`hyper-pla-rfid`) based on `product_handle`
2. Database stores a **different URL** (`hyper-pla-rfid-stardust-3d-printing-filament-1kg`)
3. Metadata lookup uses exact `product_url` match, which fails
4. Without metadata, search resolution cannot proceed

## Solution Overview

Enhance the metadata lookup to use fuzzy matching when exact URL match fails.

---

## Implementation

### Change 1: Add Fuzzy URL Matching to `getProductMetadataByUrl()`

**File:** `supabase/functions/get-current-price/index.ts`

When exact URL match fails, extract the slug from the URL and search for products with similar slugs.

```typescript
async function getProductMetadataByUrl(productUrl: string): Promise<ProductMetadata | null> {
  const supabase = getSupabaseClient();
  
  // Try exact match first
  let { data, error } = await supabase
    .from('filaments')
    .select('id, product_title, material, vendor, net_weight_g, product_url')
    .eq('product_url', productUrl)
    .limit(1);
  
  if (data && data.length > 0) {
    console.log(`Found exact match: "${data[0].product_title}"`);
    return data[0];
  }
  
  // Fuzzy match: extract slug and search by LIKE
  console.log('No exact URL match, trying fuzzy slug match...');
  const slug = extractSlugFromUrl(productUrl);
  
  if (slug && slug.length > 5) {
    const { data: fuzzyData } = await supabase
      .from('filaments')
      .select('id, product_title, material, vendor, net_weight_g, product_url')
      .ilike('product_url', `%${slug}%`)
      .limit(5);
    
    if (fuzzyData && fuzzyData.length > 0) {
      // Return the best match (first one that contains our slug)
      console.log(`Found fuzzy match: "${fuzzyData[0].product_title}" via slug "${slug}"`);
      return fuzzyData[0];
    }
  }
  
  return null;
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(s => s);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}
```

### Change 2: Use Database URL for Resolution (Not Frontend URL)

When fuzzy match succeeds, use the **database URL** (the real one) for the 404 resolution flow instead of the frontend-provided URL.

In `attemptSearchResolution()`, update to use `product.product_url` as the "original URL to exclude" rather than the frontend-provided URL.

### Change 3: Keep RFID in Search Query

**File:** `supabase/functions/get-current-price/index.ts` (buildSearchQuery)

Currently RFID is stripped from search queries. For Creality products, RFID is a key differentiator.

```typescript
function buildSearchQuery(product: ProductMetadata): string {
  let query = product.product_title;
  
  // Remove common suffixes that don't help search
  query = query
    .replace(/3D\s*Print(ing)?\s*Filament/gi, '')
    .replace(/\d+\s*[gG]\s*/g, '')
    .replace(/\d+\s*[kK][gG]\s*/g, '')
    .replace(/\d+\.\d+\s*mm/gi, '')
    // REMOVED: .replace(/RFID/gi, '') - RFID is important for Creality
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = query.split(' ').filter(w => w.length > 1).slice(0, 6);
  return words.join(' ');
}
```

---

## Expected Flow After Fix

1. Frontend sends: `https://store.creality.com/products/hyper-pla-rfid`
2. Edge function: Exact match fails
3. Edge function: Fuzzy match finds `hyper-pla-rfid-stardust-...` in database
4. Edge function: Gets metadata including title "Hyper PLA RFID 3D Printing Filament 1kg"
5. Edge function: Searches store with "Hyper PLA RFID"
6. Edge function: Finds `https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg`
7. Edge function: Validates it works, updates database, returns live price

---

## Technical Notes

- The fuzzy ILIKE search uses the slug substring (e.g., `hyper-pla-rfid`) to find matching database records
- This handles cases where regional URL building creates truncated or variant URLs
- The fix is in the edge function only - no frontend changes required

