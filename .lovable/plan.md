
# Auto-Resolution System for 404 Product URLs

## Overview

When a user visits a filament page with a broken URL, the system will:
1. Detect the 404 error
2. Look up the product's metadata (title, material, vendor)
3. Search the store's website for the product
4. Find the best matching URL from search results
5. Automatically update the database with the correct URL
6. Return the live price - all in a single transparent request

## Architecture

The solution integrates into the existing `get-current-price` Edge Function, adding a new resolution step when a 404 is detected. This leverages:
- Existing product metadata in the `filaments` table
- Firecrawl's search/scrape capabilities (already configured)
- Brand-specific search URL patterns

```text
+------------------+     +-------------------+     +------------------+
|  User visits     | --> | get-current-price | --> | 404 detected?    |
|  filament page   |     | Edge Function     |     | Try resolution   |
+------------------+     +-------------------+     +------------------+
                                                          |
                    +-------------------------------------+
                    v
           +------------------+     +------------------+     +------------------+
           | Look up product  | --> | Search store     | --> | Find best match  |
           | metadata         |     | with Firecrawl   |     | (score > 0.7)    |
           +------------------+     +------------------+     +------------------+
                                                                    |
                    +-----------------------------------------------+
                    v
           +------------------+     +------------------+
           | Update DB with   | --> | Fetch price from |
           | new URL + log    |     | resolved URL     |
           +------------------+     +------------------+
```

---

## Implementation Steps

### 1. Add Request Parameter for Product ID

The Edge Function currently only receives `productUrl` and `currency`. To look up product metadata for search, we need to either:
- **Option A**: Accept an optional `filamentId` parameter to fetch metadata
- **Option B**: Look up the filament by `product_url` from the database

We'll use **Option B** since the URL is already available and requires no frontend changes.

### 2. Create Store Search URL Patterns

Add a comprehensive map of store domains to their search URL formats:

```typescript
const STORE_SEARCH_PATTERNS: Record<string, (query: string) => string> = {
  // Major stores with known search patterns
  'store.creality.com': (q) => `https://store.creality.com/search?q=${encodeURIComponent(q)}`,
  'us.store.bambulab.com': (q) => `https://us.store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  'store.bambulab.com': (q) => `https://store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  'www.prusa3d.com': (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  'prusa3d.com': (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  'us.polymaker.com': (q) => `https://us.polymaker.com/search?q=${encodeURIComponent(q)}`,
  'polymaker.com': (q) => `https://polymaker.com/search?q=${encodeURIComponent(q)}`,
  'www.esun3d.com': (q) => `https://www.esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  'esun3d.com': (q) => `https://esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  'overture3d.com': (q) => `https://overture3d.com/search?q=${encodeURIComponent(q)}`,
  'www.sunlu.com': (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  'sunlu.com': (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  'store.anycubic.com': (q) => `https://store.anycubic.com/search?q=${encodeURIComponent(q)}`,
  'www.elegoo.com': (q) => `https://www.elegoo.com/search?q=${encodeURIComponent(q)}`,
  'colorfabb.com': (q) => `https://colorfabb.com/search?q=${encodeURIComponent(q)}`,
  'fillamentum.com': (q) => `https://fillamentum.com/search?q=${encodeURIComponent(q)}`,
  'atomicfilament.com': (q) => `https://atomicfilament.com/search?q=${encodeURIComponent(q)}`,
  'ninjatek.com': (q) => `https://ninjatek.com/search?q=${encodeURIComponent(q)}`,
  'www.proto-pasta.com': (q) => `https://www.proto-pasta.com/search?q=${encodeURIComponent(q)}`,
  'amolen.com': (q) => `https://amolen.com/search?q=${encodeURIComponent(q)}`,
  'fiberlogy.com': (q) => `https://fiberlogy.com/search?q=${encodeURIComponent(q)}`,
  'www.3dfuel.com': (q) => `https://www.3dfuel.com/search?q=${encodeURIComponent(q)}`,
  'voxelpla.com': (q) => `https://voxelpla.com/search?q=${encodeURIComponent(q)}`,
  'ziro3d.com': (q) => `https://ziro3d.com/search?q=${encodeURIComponent(q)}`,
  // Generic fallback pattern for unknown Shopify stores
};

// Fallback for unknown stores (most Shopify stores use /search?q=)
function getStoreSearchUrl(domain: string, query: string): string | null {
  const pattern = STORE_SEARCH_PATTERNS[domain];
  if (pattern) return pattern(query);
  
  // Generic Shopify fallback
  return `https://${domain}/search?q=${encodeURIComponent(query)}`;
}
```

### 3. Create Product Metadata Lookup Function

```typescript
interface ProductMetadata {
  id: string;
  product_title: string;
  material: string | null;
  vendor: string | null;
  net_weight_g: number | null;
}

async function getProductMetadata(productUrl: string): Promise<ProductMetadata | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('filaments')
    .select('id, product_title, material, vendor, net_weight_g')
    .eq('product_url', productUrl)
    .maybeSingle();
  
  if (error || !data) return null;
  return data;
}
```

### 4. Create Search Query Builder

Simplify product title to create an effective search query:

```typescript
function buildSearchQuery(product: ProductMetadata): string {
  // Start with product title
  let query = product.product_title;
  
  // Remove common suffixes that don't help search
  query = query
    .replace(/3D\s*Print(ing)?\s*Filament/gi, '')
    .replace(/\d+\s*[gG]\s*/g, '')  // Remove weight like "1000g"
    .replace(/\d+\s*[kK][gG]\s*/g, '') // Remove weight like "1kg"
    .replace(/\d+\.\d+\s*mm/gi, '') // Remove diameter like "1.75mm"
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit length for search
  const words = query.split(' ').slice(0, 6);
  return words.join(' ');
}

// Examples:
// "Hyper PLA RFID 3D Printing Filament 1kg" -> "Hyper PLA RFID"
// "Bambu Lab PLA Basic Filament - Black 1.75mm" -> "Bambu Lab PLA Basic Black"
```

### 5. Create URL Similarity Scorer

```typescript
function calculateUrlSimilarity(url: string, productTitle: string): number {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Extract slug from URL (last path segment)
    const segments = path.split('/').filter(s => s);
    const slug = segments[segments.length - 1] || '';
    
    // Split slug into words (by hyphens/underscores)
    const slugWords = slug.split(/[-_]/).filter(w => w.length > 1);
    
    // Normalize product title to words
    const titleWords = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', '3d', 'printing', 'filament'].includes(w));
    
    if (titleWords.length === 0) return 0;
    
    // Count matching words
    let matches = 0;
    for (const titleWord of titleWords) {
      if (slugWords.some(sw => sw.includes(titleWord) || titleWord.includes(sw))) {
        matches++;
      }
    }
    
    return matches / titleWords.length;
  } catch {
    return 0;
  }
}
```

### 6. Create Search Resolution Function

```typescript
interface SearchResolutionResult {
  success: boolean;
  newUrl: string | null;
  score: number;
  method: 'search_resolution';
}

async function attemptSearchResolution(
  productUrl: string,
  storeDomain: string
): Promise<SearchResolutionResult> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  
  // Step 1: Get product metadata
  const product = await getProductMetadata(productUrl);
  if (!product) {
    console.log('No product metadata found for URL:', productUrl);
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  
  // Step 2: Build search query
  const searchQuery = buildSearchQuery(product);
  console.log(`Search query for "${product.product_title}": "${searchQuery}"`);
  
  // Step 3: Get store search URL
  const searchUrl = getStoreSearchUrl(storeDomain, searchQuery);
  if (!searchUrl) {
    console.log('No search URL pattern for domain:', storeDomain);
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  
  console.log('Searching store:', searchUrl);
  
  // Step 4: Scrape search results with Firecrawl
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['links'],
        waitFor: 3000,
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl search failed:', response.status);
      return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
    }
    
    const data = await response.json();
    const links: string[] = data.data?.links || data.links || [];
    
    // Step 5: Filter to product links only
    const productLinks = links.filter(link => {
      try {
        const linkUrl = new URL(link);
        // Must be same domain
        if (!linkUrl.hostname.includes(storeDomain.replace('www.', ''))) return false;
        // Must contain product indicators
        return linkUrl.pathname.includes('/products/') || 
               linkUrl.pathname.includes('/product/') ||
               linkUrl.pathname.includes('/p/');
      } catch {
        return false;
      }
    });
    
    console.log(`Found ${productLinks.length} product links on search page`);
    
    // Step 6: Score each link
    const scoredLinks = productLinks.map(url => ({
      url,
      score: calculateUrlSimilarity(url, product.product_title),
    }));
    
    // Step 7: Get best match with score > 0.7
    const bestMatch = scoredLinks
      .filter(l => l.score >= 0.7)
      .sort((a, b) => b.score - a.score)[0];
    
    if (bestMatch) {
      console.log(`Best match found: ${bestMatch.url} (score: ${bestMatch.score})`);
      return {
        success: true,
        newUrl: bestMatch.url,
        score: bestMatch.score,
        method: 'search_resolution',
      };
    }
    
    console.log('No matching product found with score >= 0.7');
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  } catch (err) {
    console.error('Search resolution error:', err);
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
}
```

### 7. Create Auto-Fix Logging Table

Create a migration to track auto-resolved URLs for audit trail:

```sql
-- Create table to track auto-fixed URLs
CREATE TABLE IF NOT EXISTS public.url_auto_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES filaments(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  new_url TEXT NOT NULL,
  resolution_method TEXT NOT NULL, -- 'redirect_detection' or 'search_resolution'
  similarity_score NUMERIC(4,3), -- For search resolution matches
  fixed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by filament
CREATE INDEX idx_url_auto_fixes_filament ON url_auto_fixes(filament_id);

-- Index for recent fixes
CREATE INDEX idx_url_auto_fixes_fixed_at ON url_auto_fixes(fixed_at DESC);

-- Enable RLS (admin only)
ALTER TABLE url_auto_fixes ENABLE ROW LEVEL SECURITY;

-- RLS policy for service role only (Edge Functions)
CREATE POLICY "Service role can manage url_auto_fixes"
  ON url_auto_fixes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 8. Update Edge Function 404 Handling

Modify the 404 detection blocks in `get-current-price` to attempt resolution:

```typescript
// In fetchShopifyPrice() and fetchPriceWithFirecrawl():

// After detecting 404...
if (is404) {
  console.log(`Detected 404 for product: ${productUrl}`);
  
  // Attempt auto-resolution via search
  const storeDomain = extractDomain(productUrl);
  const resolution = await attemptSearchResolution(productUrl, storeDomain);
  
  if (resolution.success && resolution.newUrl) {
    // Update the filament record
    const supabase = getSupabaseClient();
    
    await supabase
      .from('filaments')
      .update({ 
        product_url: resolution.newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('product_url', productUrl);
    
    // Log the auto-fix
    const product = await getProductMetadata(productUrl);
    await supabase
      .from('url_auto_fixes')
      .insert({
        filament_id: product?.id,
        original_url: productUrl,
        new_url: resolution.newUrl,
        resolution_method: resolution.method,
        similarity_score: resolution.score,
      });
    
    // Mark broken URL as resolved
    await supabase
      .from('broken_product_urls')
      .update({
        resolved_at: new Date().toISOString(),
        new_url: resolution.newUrl,
        notes: `Auto-resolved via ${resolution.method} (score: ${resolution.score})`,
      })
      .eq('product_url', productUrl);
    
    console.log(`Auto-resolved URL: ${productUrl} -> ${resolution.newUrl}`);
    
    // Retry price fetch with the new URL
    return fetchPriceWithFirecrawl(resolution.newUrl, preferredCurrency, brandConfig);
  }
  
  // Resolution failed - log broken URL and return 404 response
  await logBrokenUrl(productUrl, '404_not_found');
  return {
    success: false,
    error: 'PRODUCT_PAGE_NOT_FOUND',
    is404: true,
    // ... other fields
  };
}
```

### 9. Add Rate Limiting (Safeguard)

Prevent excessive auto-fix attempts:

```typescript
async function canAttemptAutoFix(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Check if we've already attempted today
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('url_auto_fixes')
    .select('id')
    .eq('original_url', productUrl)
    .gte('fixed_at', oneDayAgo)
    .limit(1);
  
  // Allow if no recent attempts (prevents repeated failed attempts)
  return !data || data.length === 0;
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXXXXX_url_auto_fixes.sql` | **Create** | Migration for `url_auto_fixes` audit table |
| `supabase/functions/get-current-price/index.ts` | **Modify** | Add search resolution logic, store patterns, similarity scoring |

---

## Technical Considerations

1. **Firecrawl Credit Usage**: Each search resolution attempt uses 1 Firecrawl credit for the search page scrape. We only attempt resolution on actual 404s.

2. **Score Threshold**: Using 0.7 (70%) match score ensures high confidence. This prevents updating to wrong products.

3. **Recursive Prevention**: After resolving a URL, we immediately call `fetchPriceWithFirecrawl` with the new URL. If that also 404s, we won't re-attempt (the `canAttemptAutoFix` check prevents this).

4. **Audit Trail**: All auto-fixes are logged to `url_auto_fixes` table for admin review.

5. **Existing Integration**: This builds on the existing `handleUrlRedirect` function for redirect detection. Search resolution is a fallback when redirects don't help.

6. **No Frontend Changes Required**: The resolution happens transparently during price fetch. Users simply get the price without seeing the 404.

---

## Success Metrics

- Reduced manual URL fixes needed in admin panel
- Faster resolution of broken URLs (automatic vs. manual)
- Audit log provides visibility into automated fixes
- User experience improvement: fewer "Product page moved" errors

