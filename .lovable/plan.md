
# Add ItemList JSON-LD Schema to Guide Pages

## What This Does

Guide pages (`/guides/best-pla-filaments`, `/guides/best-filament-for-creality-k1`, etc.) already emit three structured-data blocks via `<script type="application/ld+json">`:
- `Article` — via `<ArticleSchema>`
- `BreadcrumbList` — via `<BreadcrumbSchema>`
- `FAQPage` — via `<FAQSchema>`

This adds a fourth block: **`ItemList`**, containing one `ListItem` per ranked filament, each embedding a `Product` object with brand, material, price, and a canonical FilaScope URL. This helps Google display the ranked list directly in search results (ListCarousel rich result).

---

## Files to Change

### 1. `src/components/seo/ItemListSchema.tsx` — Extend the item shape

The existing `ItemListItem` interface only supports `name`, `url`, `image`, `description`. The requirements ask for richer `Product` data: `brand` (as a `Brand` typed object), `material`, and `offers` (with `price` and `priceCurrency`).

The component's `useJsonLd` call will be updated to emit these additional fields when present:

```
itemListElement: items.map((item, index) => ({
  '@type': 'ListItem',
  position: item.position || index + 1,
  name: item.name,
  url: item.url,
  item: {
    '@type': 'Product',
    name: item.name,
    url: item.url,
    ...(item.image && { image: item.image }),
    ...(item.description && { description: item.description }),
    ...(item.brand && { brand: { '@type': 'Brand', name: item.brand } }),
    ...(item.material && { material: item.material }),
    ...(item.price != null && item.priceCurrency && {
      offers: {
        '@type': 'Offer',
        price: item.price,
        priceCurrency: item.priceCurrency,
        availability: 'https://schema.org/InStock',
      },
    }),
  },
}))
```

New fields added to `ItemListItem`:
- `brand?: string` — vendor name (e.g., `"Bambu Lab"`)
- `material?: string` — material type (e.g., `"PLA"`)
- `price?: number` — numeric price (e.g., `24.99`)
- `priceCurrency?: string` — ISO currency code (e.g., `"USD"`)

The `name` field also moves up to the `ListItem` level alongside the nested `item` object (both the Google docs and the existing component have `name` only inside `item` — adding it at the `ListItem` level too is correct per schema.org spec for `ListItem`).

### 2. `src/components/guides/BuyingGuideTemplate.tsx` — Wire it in

**Import** `ItemListSchema` at the top.

**Add** the `<ItemListSchema>` component in the Structured Data block (lines 117–126), right after the existing three schemas, conditioned on:
- `layout === 'ranked-list'` (only ranked guides get an ItemList — VS-comparison and editorial layouts don't produce a clean ordered list)
- `filaments` is loaded and non-empty

The items array is built inline by mapping the `filaments` array:

```tsx
{config.layout === 'ranked-list' && filaments && filaments.length > 0 && (
  <ItemListSchema
    name={config.title}
    description={config.seoDescription}
    itemListOrder="Descending"
    items={filaments.map((f, i) => {
      const slug = f.product_handle || generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
      return {
        position: i + 1,
        name: f.product_title,
        url: `https://filascope.com/filament/${slug}`,
        image: f.featured_image ?? undefined,
        brand: f.vendor ?? undefined,
        material: f.material ?? undefined,
        price: f.variant_price ?? undefined,
        priceCurrency: 'USD',
      };
    })}
  />
)}
```

**Key decisions:**
- URL uses `product_handle` first (the stored SEO slug, e.g. `bambu-lab-pla-basic-black`), falling back to `generateFilamentSlug` — this matches how `GuideProductCard` and `GuideComparisonTable` both build their `/filament/` links
- `itemListOrder="Descending"` — because position 1 is the best/highest-scoring item
- `priceCurrency` hardcoded to `"USD"` — `variant_price` in the DB is in USD; the `useResolvedPrice` hook converts regionally at render time but USD is the canonical source for schema data
- `image` is optional and only included when `featured_image` is present, consistent with the existing `ItemListSchema` logic
- No UI changes — the component returns `null`

---

## No Changes To

- `ArticleSchema`, `BreadcrumbSchema`, `FAQSchema` — untouched
- `GuideProductCard`, `GuideComparisonTable` — untouched
- `useJsonLd` hook — untouched
- VS-comparison or editorial layout guide pages — no ItemList is emitted for those layouts
- Any database queries or data fetching logic
