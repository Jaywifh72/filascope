

## Create HueForge TD Value Landing Page

A new content-rich landing page at `/hueforge-td-database` targeting high-intent SEO keywords like "HueForge TD values", "filament TD database", and "transmissivity data for HueForge". This differs from the two existing tool pages (`/hueforge-filaments` and `/td-database`) by combining educational content with the data table for maximum search ranking potential.

---

### What Gets Built

**New file: `src/pages/HueForgeTDDatabase.tsx`**

A single-page component with these sections:

1. **Hero** -- H1 "HueForge TD Value Database", dynamic subtitle with filament/brand counts, search bar, CTA linking to filters below
2. **Educational Content (H2 sections)** -- "What is TD (Transmissivity Distance) in HueForge?" and "How to Use TD Values for Better Lithophanes" with 2-3 paragraphs each of original, keyword-rich text
3. **Filterable Data Table** -- Reuses the query pattern from TDDatabase.tsx (filaments WHERE transmission_distance IS NOT NULL). Columns: color swatch, brand, product name, material, color family, TD value, price, link. Sortable by TD, brand, material. Filterable by material, color family, brand. Links each row to `/filament/{slug}`
4. **Most Popular for HueForge** -- Top 10 filaments by lowest TD (most opaque, most commonly needed), displayed as cards above the full table
5. **FAQ Section** -- 5 questions with Accordion UI. Covers: ideal TD values, best colors, finding TD values, PETG for HueForge, TD vs opacity
6. **Schema Markup** -- FAQPage, Dataset, BreadcrumbList JSON-LD via existing SEO components

**SEO metadata:**
- Title: "HueForge TD Value Database -- Transmissivity Data | FilaScope" (55 chars)
- Description: Dynamic with counts, under 160 chars
- Canonical: `https://filascope.com/hueforge-td-database`
- og:title and og:description synchronized

---

### Routing and Internal Linking

**`src/App.tsx`** -- Add lazy import and route for `/hueforge-td-database`

**`src/components/Navbar.tsx`** -- Add "HueForge TD Database" entry to the "Tools & Software" section of the Learn dropdown menu (line ~232)

**Cross-linking from existing pages:**
- `src/pages/HueForgeFinder.tsx` -- Add a link/button in the hero: "Browse Full TD Database"
- `src/pages/TDDatabase.tsx` -- Add a link in the hero: "Learn about HueForge & TD Values"

---

### Technical Details

- Data query: Same pattern as TDDatabase.tsx -- `supabase.from('filaments').select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, net_weight_g, product_handle, featured_image').not('transmission_distance', 'is', null)`
- React Query key: `['hueforge-td-database']` (distinct from existing pages to avoid cache conflicts)
- Uses existing UI components: Table, Card, Accordion, Badge, Input, Select, Button, Skeleton
- Uses existing SEO components: FAQSchema, DatasetSchema, BreadcrumbSchema
- CSV export button carried over from TDDatabase pattern
- Table shows first 100 rows with "use filters" message for overflow
- Price column uses `useCurrency` hook for regional formatting

### Files Modified

```
New:    src/pages/HueForgeTDDatabase.tsx
Edit:   src/App.tsx                    (add route + lazy import)
Edit:   src/components/Navbar.tsx       (add Learn menu item)
Edit:   src/pages/HueForgeFinder.tsx    (add cross-link)
Edit:   src/pages/TDDatabase.tsx        (add cross-link)
```
