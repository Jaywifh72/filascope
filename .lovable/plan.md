
# Plan: Populate Amazon ASINs for Remaining 3DHOJOR Products

## Summary

The `discover-amazon-products` Edge Function already exists and has populated 95 of 118 (80.5%) 3DHOJOR products with Amazon links. We need to run it again with a focus on the remaining 23 products.

## Current State

| Metric | Value |
|--------|-------|
| Total 3DHOJOR products | 118 |
| With Amazon US link | 95 (80.5%) |
| Missing Amazon link | 23 |

### Products Still Missing Amazon Links

- **TPU 95A Flexible** (4 colors: Grey, White, Transparent Red, Clear)
- **Silk Dual/Tri Color PLA** (12 variants)
- **Crystal Rainbow PLA** (2 variants)
- **PLA Pro** (4 colors: Red, Grey, Bone White, Peak Green)
- **Matte PLA** (2 colors: Light Blue, Almond Yellow)
- **Rapid PLA** (2 colors: Black, Yellow)

---

## Implementation Plan

### Step 1: Run Discovery Function for Remaining Products

Call the `discover-amazon-products` Edge Function to process the 23 remaining products:

```typescript
// Execute via Edge Function
await supabase.functions.invoke('discover-amazon-products', {
  body: {
    vendor: '3DHOJOR',
    limit: 30  // Process all remaining (23 + buffer)
  }
});
```

The function automatically:
1. Fetches filaments where `amazon_link_us IS NULL` or `amazon_match_confidence < 70`
2. Searches Amazon using multiple strategies (barcode, MPN, SKU, text)
3. Calculates match confidence scores
4. Updates database with high-confidence matches (≥70%)

---

### Step 2: Review Results

Check the response for:
- **High confidence matches**: Automatically updated in database
- **Low confidence matches**: May need manual verification
- **No results**: Products not available on Amazon US

### Step 3: Manual ASIN Research (If Needed)

For products that couldn't be auto-matched, perform manual Amazon searches:

| Product Category | Recommended Search Query |
|-----------------|-------------------------|
| TPU 95A | `3DHOJOR TPU 95A 1.75mm flexible` |
| Silk Dual/Tri Color | `3DHOJOR silk PLA dual color` |
| Crystal Rainbow | `3DHOJOR rainbow transparent PLA` |
| PLA Pro | `3DHOJOR PLA+ PLA Pro 1.75mm` |
| Matte PLA | `3DHOJOR matte PLA filament` |
| Rapid PLA | `3DHOJOR high speed PLA` |

### Step 4: Update Database for Manual Finds

For any manually discovered ASINs:

```sql
UPDATE filaments
SET 
  amazon_link_us = 'https://www.amazon.com/dp/{ASIN}',
  amazon_match_confidence = 100,  -- Manual verification
  amazon_prices_last_updated_at = NOW()
WHERE id = '{filament_id}';
```

---

## Technical Details

### Edge Function Behavior

The `discover-amazon-products` function uses a priority-based matching strategy:

1. **Barcode Search** (Priority 1) - Uses UPC/EAN/GTIN for exact matches (+30 bonus)
2. **MPN Search** (Priority 2) - Uses manufacturer part number (+20 bonus)
3. **SKU Search** (Priority 3) - Uses variant SKU (+15 bonus)
4. **Store Search** (Priority 4) - Uses brand's Amazon store URL (+10 bonus)
5. **Text Search** (Priority 5) - Fallback using product title

### Match Confidence Scoring

- Brand name match: 40 points
- Material match: 25 points
- Title word overlap: 25 points
- Price sanity check: 10 points
- Method bonus: 10-30 points

**Threshold**: Only matches with ≥70% confidence are automatically saved.

### Rate Limiting

- 2 seconds between API requests
- SerpAPI primary, ScrapingDog fallback on quota errors

---

## Expected Outcome

| Scenario | Expected Result |
|----------|-----------------|
| Products available on Amazon | Auto-matched and updated |
| Niche variants (Crystal Rainbow) | May need manual search |
| Products not on Amazon | Will show `no_results` status |

After completion:
- Target: 100+ products with Amazon links
- Remaining products likely not available on Amazon US marketplace

---

## Alternative: Use find-amazon-products Function

If `discover-amazon-products` doesn't find certain products, we can also use the `find-amazon-products` function with specific search terms:

```typescript
await supabase.functions.invoke('find-amazon-products', {
  body: {
    product_name: '3DHOJOR TPU 95A flexible filament',
    country_codes: ['US']
  }
});
```

This is a more targeted search that can be used for individual products.
