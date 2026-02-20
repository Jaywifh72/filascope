
## Adding FAQPage JSON-LD to Material Category & Brand Pages

### What's Already Working (No Changes Needed)

- `/materials/pla`, `/materials/petg`, etc. — `MaterialHub.tsx` already emits a rich `FAQPage` JSON-LD with 6-8 material-specific questions via `getMaterialFAQs()` + renders a visible accordion via `<FAQSection>`.
- `/filament/:slug` — `FilamentFAQSchema` emits per-product FAQPage JSON-LD.
- `/brands/bambu-lab` — `BrandFAQSection` emits `FAQPage` JSON-LD + visible accordion, but answers are largely generic with no live DB data.

### The Two Real Gaps

**Gap 1 — `/filaments/pla` material listing pages have NO FAQPage JSON-LD**

`FilamentCategoryPage.tsx` (the `/filaments/pla` route) emits a `CollectionPage` + `ItemList` JSON-LD but no `FAQPage`. The `CATEGORY_META` record already has per-material intro text, and the page already fetches `materialCount`. It needs:
- A DB query to fetch `avgPrice`, `brandCount`, and `topBrands` for the material
- A `generateMaterialCategoryFAQs()` function producing 5-6 dynamic questions per material slug
- A `<FAQSchema>` injection + a visible `<FAQSection>` accordion below the product grid

**Gap 2 — `/brands/bambu-lab` FAQ answers are mostly hardcoded boilerplate**

`BrandFAQSection` gets `brandName`, `productCount`, `materials`, `isVerified`, `isPremium`, `isBudgetFriendly`. But the parent `BrandDetail.tsx` already has live data that isn't passed down:
- `filaments[]` — can derive avg price, regional price columns (`price_cad`, `price_eur`, `price_gbp`), and retailer domains from `product_url`
- `automatedBrand` — has `website`, `display_name`, price coverage info
- These should be derived and passed as props to get answers like: actual price range, which regions have prices, which retailer domains are linked

### Implementation Plan

---

#### Change 1 — `FilamentCategoryPage.tsx`

**Add a `useQuery` for material stats** (avg price, brand count, top brand names):

```typescript
const { data: materialStats } = useQuery({
  queryKey: ["filament-category-stats", slug],
  enabled: !!slug && !!config,
  queryFn: async () => {
    const { data } = await (supabase as any)
      .from("filaments")
      .select("vendor, variant_price")
      .in("material", config!.materials)
      .not("variant_price", "is", null)
      .limit(500);
    if (!data) return null;
    const prices = (data as any[]).map((d: any) => d.variant_price).filter(Boolean) as number[];
    const brandCounts: Record<string, number> = {};
    for (const row of data as any[]) {
      if (row.vendor) brandCounts[row.vendor] = (brandCounts[row.vendor] || 0) + 1;
    }
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([v]) => v);
    return {
      avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      topBrands,
    };
  },
  staleTime: 1000 * 60 * 10,
});
```

**Add a `generateMaterialCategoryFAQs()` function** producing 5-6 questions:

| Question | Answer Source |
|---|---|
| "What is {Material} filament?" | Pull from `CATEGORY_META[slug].introTemplate` (already present) |
| "What temperature does {Material} print at?" | Material-specific nozzle/bed ranges hardcoded per slug (mirroring `MaterialHub.tsx` data) |
| "Is {Material} good for beginners?" | Derived: PLA/PLA+/Silk PLA → Yes; TPU/Nylon/PC/ABS/ASA → No/Intermediate |
| "How much does {Material} filament cost?" | `materialStats.minPrice`–`materialStats.maxPrice` from DB |
| "Does {Material} need an enclosure?" | Per-material flag (ABS/ASA/Nylon/PC → Yes; PLA/PETG/TPU → No) |
| "What brands make {Material} filament?" | `materialStats.topBrands.join(', ')` from DB |

**Add `<FAQSchema>` and `<FAQSection>`** below the product grid (above `RelatedSearchesSection`):

```tsx
{slug && materialFaqs.length > 0 && (
  <FAQSection faqs={materialFaqs} title={`${label} Filament FAQ`} />
)}
```

`FAQSchema` is already imported via `FAQSection`. No new schema injection needed — `FAQSection` calls it internally.

**Imports to add**: `FAQSection` from `@/components/seo`.

---

#### Change 2 — `BrandFAQSection.tsx` — Upgrade Props + Answers

**Extend the props interface** to accept richer data:

```typescript
interface BrandFAQSectionProps {
  brandName: string;
  productCount: number;
  materials: string[];
  avgPrice?: string;        // existing
  // NEW:
  priceRange?: { min: number; max: number } | null;
  topRetailers?: string[];  // e.g. ["Official Store", "Amazon"]
  regionsCovered?: string[]; // e.g. ["US", "CA", "EU", "UK"]
  isVerified?: boolean;
  isPremium?: boolean;
  isBudgetFriendly?: boolean;
}
```

**Upgrade the four existing FAQ answers** to be data-driven:
1. **Quality FAQ** — unchanged (already has premium/budget branching)
2. **Where to buy** — use `topRetailers` list if available; otherwise fall back to current text
3. **Materials FAQ** — unchanged (already lists materials)
4. **Price FAQ** — use `priceRange` to show `$X.XX–$Y.YY per kg` instead of a vague `avgPrice` string
5. **ADD: Regional shipping FAQ** — if `regionsCovered.length > 1`: "Does {Brand} ship internationally? → {Brand} products are available in {regions.join(', ')}. FilaScope tracks regional pricing and availability for all listed regions."

**In `BrandDetail.tsx`**, derive and pass the new props:

```tsx
// Derive price range
const brandPriceRange = useMemo(() => {
  if (!filaments || filaments.length === 0) return null;
  const prices = filaments.map(f => f.variant_price).filter((p): p is number => p !== null && p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}, [filaments]);

// Derive top retailer domain names from product URLs
const topRetailers = useMemo(() => {
  if (!filaments) return [];
  const domainCounts: Record<string, number> = {};
  for (const f of filaments) {
    if (!f.product_url) continue;
    try {
      const domain = new URL(f.product_url).hostname.replace(/^www\./, '');
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    } catch {}
  }
  return Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => {
      if (domain.includes('amazon')) return 'Amazon';
      // Capitalize brand's own domain into "Official Store"
      if (domain.includes(brandSlug.replace(/-/g, ''))) return 'Official Store';
      return domain.replace(/\.(com|net|org|store|shop).*$/, '').replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    });
}, [filaments, brandSlug]);

// Derive which regions have price data
const regionsCovered = useMemo(() => {
  if (!filaments) return ['US'];
  const regions: string[] = [];
  if (filaments.some(f => f.variant_price && f.variant_price > 0)) regions.push('US');
  if (filaments.some(f => (f as any).price_cad && (f as any).price_cad > 0)) regions.push('CA');
  if (filaments.some(f => (f as any).price_eur && (f as any).price_eur > 0)) regions.push('EU');
  if (filaments.some(f => (f as any).price_gbp && (f as any).price_gbp > 0)) regions.push('UK');
  if (filaments.some(f => (f as any).price_aud && (f as any).price_aud > 0)) regions.push('AU');
  if (filaments.some(f => (f as any).price_jpy && (f as any).price_jpy > 0)) regions.push('JP');
  return regions;
}, [filaments]);
```

Update the `<BrandFAQSection>` call in `BrandDetail.tsx`:

```tsx
<BrandFAQSection
  brandName={displayName}
  productCount={filaments?.length ?? 0}
  materials={availableMaterials}
  priceRange={brandPriceRange}
  topRetailers={topRetailers}
  regionsCovered={regionsCovered}
  isVerified={automatedBrand?.is_visible ?? false}
  isPremium={isPremium}
  isBudgetFriendly={isBudgetFriendly}
/>
```

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/FilamentCategoryPage.tsx` | Add `materialStats` query, `generateMaterialCategoryFAQs()`, `FAQSection` import + render |
| `src/components/brands/BrandFAQSection.tsx` | Extend props, upgrade FAQ generators to use live price range, retailers, regions |
| `src/pages/BrandDetail.tsx` | Add `brandPriceRange`, `topRetailers`, `regionsCovered` memos; pass to `BrandFAQSection` |

### Expected Outcome

After this change:
- All `/filaments/pla`, `/filaments/petg`, etc. pages emit a `FAQPage` JSON-LD with 5-6 dynamic questions driven by live DB price/brand data
- All `/brands/bambu-lab`, `/brands/polymaker`, etc. pages emit a `FAQPage` JSON-LD where answers include actual price ranges (`$18–$32/kg`), actual retailer names (from `product_url` domains), and regions with pricing coverage (`US, CA, EU, UK`)
- Both add visible FAQ accordions matching the JSON-LD content, satisfying Google's requirement that schema content must be visible on the page
