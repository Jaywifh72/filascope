

# Quality Improvement Pass — Image and Data Issues

## Task 1: Footer "FFilaScope" Visual Fix
**Priority: Immediate | Effort: 5 min**

The footer renders a square icon containing "F" followed by the text "FilaScope", which visually reads as "FFilaScope". Fix by either:
- Replacing the "F" text inside the icon with a small logo/icon graphic, OR
- Changing the icon content to a non-letter symbol (e.g., a small activity/zap icon), OR
- Removing the separate "F" box and just rendering "FilaScope" as styled text

**File:** `src/components/SiteFooter.tsx` (lines 138-143)

---

## Task 2: Product Count UX Clarification
**Priority: High | Effort: 20 min**

Currently shows: `1,048 Products of 1,073` with no explanation of WHY the numbers differ.

The `ResultsHeader` already has a `selectedPrinter` subtitle ("Compatible with Bambu Lab H2C") but it appears on a separate line below the count. The fix:
- When a printer filter is active AND `totalCatalogCount > count`, change the "of X" text to include context: `"of {total} total — filtered by {printerBrand} {printerName} compatibility"`
- Alternatively, integrate the printer context inline: `1,048 Compatible Products (1,073 total)`

**Files:** `src/components/ResultsHeader.tsx` (lines 53-58)

---

## Task 3: Brand Logo Optimization
**Priority: Medium | Effort: 2-3 hours (manual/iterative)**

Current state: 49 logo files — 20 are already `.webp`, 29 are `.png`/`.jpg`.

Files needing conversion to WebP:
```text
.png: 3dsolutech, 3dxtech, ankermake, azurefilm, creality, eryone, esun, 
      extrudr, filaments-ca, flashforge, formfutura, geeetech, hatchbox, 
      ic3d, markforged, ninjatek, numakers, polymaker, protopasta, 
      prusament, pushplastic, qidi, raise3d, recreus, sirayatech, 
      snapmaker, spectrum, sunlu, treed, ultimaker
.jpg: atomic
```

**Approach:**
- This requires re-uploading optimized files through the chat (drag-and-drop). Lovable cannot run image conversion tools directly.
- For each logo: resize to max 400px wide, convert to WebP, target under 20KB
- After uploading new `.webp` versions, update `src/lib/brandLogos.ts` to reference `.webp` extensions
- Remove old `.png`/`.jpg` files

**Recommendation:** Handle this in a dedicated session — batch convert externally, upload all at once, then update the mapping file.

---

## Task 4: "No Image" Data Enrichment
**Priority: Medium | Effort: 2-4 hours**

Database audit results:
| Brand | Missing Images |
|-------|---------------|
| Fiberlogy | 25 |
| Prusament | 5 |
| **Total** | **30** |

This is relatively small (30 products). Approach:

1. **Query the specific products** to get their `product_url` values
2. **Extend the existing `scrape-new-brand-images` edge function** — it already handles Shopify CDN scraping with Firecrawl. Add Fiberlogy and Prusament URL patterns to `extractProductImage()`
3. **Run the scraper** from the admin panel targeting these two brands
4. **Manual fallback** — for any products where scraping fails, manually find and insert image URLs via SQL

The existing edge function (`supabase/functions/scrape-new-brand-images/index.ts`) already supports these brands in its query — just needs to be invoked with `brands: ["Fiberlogy", "Prusament"]`.

---

## Task 5: Image CDN Proxy (Deferred)
**Priority: Low | Effort: 4+ hours**

This is an architectural change with significant scope. The approach would be:
1. Create an edge function that fetches external images, stores them in Lovable Cloud storage, and returns the storage URL
2. Run a batch job to cache all product images
3. Update image URLs in the database to point to cached versions

**Recommendation:** Defer this. The srcset and WebP optimizations already implemented provide most of the performance benefit. External CDNs (Shopify, etc.) are reliable and fast. Revisit only if load times become a measurable problem.

---

## Implementation Order

| Step | Task | Files Changed |
|------|------|--------------|
| 1 | Fix footer "FFilaScope" | `SiteFooter.tsx` |
| 2 | Clarify product count UX | `ResultsHeader.tsx` |
| 3 | Run image scraper for Fiberlogy/Prusament | Admin panel action (no code change) |
| 4 | Brand logo WebP conversion | `public/brands/*`, `brandLogos.ts` |
| 5 | CDN proxy (deferred) | — |

Steps 1-2 are quick code fixes. Step 3 uses existing infrastructure. Step 4 requires external image processing and a dedicated upload session.

