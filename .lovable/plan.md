
# Plan: Add JSON-LD Structured Data for Rich Search Results

## Overview
This plan adds comprehensive Schema.org JSON-LD structured data to improve search result appearance with rich snippets. The site already has some SEO components (`ProductJsonLd`, `FAQSchema`, `ItemListSchema`, `DatasetSchema`) but is missing key schemas for the homepage, brands listing, and breadcrumb navigation.

---

## Implementation Steps

### 1. Create WebSiteSchema Component for Homepage
Create a new reusable component for WebSite schema with SearchAction.

**New file**: `src/components/seo/WebSiteSchema.tsx`

```typescript
// Renders JSON-LD for WebSite schema with:
// - name: "FilaScope"
// - url: "https://filascope.com"
// - description: site meta description
// - potentialAction: SearchAction pointing to /?searchTerm={query}
```

Key schema structure:
- `@type: "WebSite"`
- `potentialAction` with `SearchAction` type
- `query-input: "required name=search_term_string"`
- Target URL: `https://filascope.com/?searchTerm={search_term_string}`

### 2. Create BreadcrumbSchema Component
Create a reusable component for BreadcrumbList schema.

**New file**: `src/components/seo/BreadcrumbSchema.tsx`

```typescript
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}
```

Key schema structure:
- `@type: "BreadcrumbList"`
- `itemListElement` array with `ListItem` objects
- Each item has `position`, `name`, and `item` (URL)

### 3. Create OrganizationSchema Component (Optional Enhancement)
Add Organization schema to homepage for brand recognition.

**New file**: `src/components/seo/OrganizationSchema.tsx`

```typescript
// Renders JSON-LD for Organization schema with:
// - name: "FilaScope"
// - url: "https://filascope.com"
// - logo: "https://filascope.com/og-image.png"
// - sameAs: social media links (if any)
```

### 4. Add WebSite Schema to Homepage (Finder.tsx)
Import and render the WebSiteSchema component on the homepage.

**Edit file**: `src/pages/Finder.tsx`

- Import `WebSiteSchema` and `OrganizationSchema` from `@/components/seo`
- Add near the top of the JSX return (before the hero section)
- Include site description and search target URL

### 5. Add ItemListSchema to Brands Page
The Brands page already has `ItemListSchema` available but needs to use it.

**Edit file**: `src/pages/Brands.tsx`

- Import `ItemListSchema` from `@/components/seo`
- Map filtered brands to the required format with name, url, image, description
- Render the schema with:
  - `name: "3D Printer Filament Brands"`
  - `description: "Directory of 3D printing filament manufacturers..."`
  - `items`: array of brand objects

### 6. Enhance ProductJsonLd with AggregateRating
The existing `ProductJsonLd` component needs to support `aggregateRating` for FilaScope scores.

**Edit file**: `src/components/seo/ProductJsonLd.tsx`

Add new optional props:
- `ratingValue?: number` - the FilaScope score (0-10)
- `ratingCount?: number` - number of ratings/reviews
- `bestRating?: number` - defaults to 10
- `worstRating?: number` - defaults to 0

Add to JSON-LD output:
```json
{
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 8.5,
    "bestRating": 10,
    "worstRating": 0,
    "ratingCount": 42
  }
}
```

### 7. Add BreadcrumbSchema to Detail Pages
Add breadcrumb schema to pages with "Back" navigation.

**Edit files**:
- `src/pages/FilamentDetail.tsx`: Home > Materials > [Brand] > [Product]
- `src/pages/PrinterDetail.tsx`: Home > Printers > [Manufacturer] > [Model]
- `src/pages/BrandDetail.tsx`: Home > Brands > [Brand Name]

Example for FilamentDetail:
```typescript
<BreadcrumbSchema items={[
  { name: 'Home', url: 'https://filascope.com/' },
  { name: 'Materials', url: 'https://filascope.com/' },
  { name: filament.vendor || 'Brand', url: `https://filascope.com/brand/${brandSlug}` },
  { name: displayName, url: `https://filascope.com/filament/${filament.id}` },
]} />
```

### 8. Update SEO Index Exports
Add new components to the central exports file.

**Edit file**: `src/components/seo/index.ts`

```typescript
export { WebSiteSchema } from './WebSiteSchema';
export { BreadcrumbSchema } from './BreadcrumbSchema';
export { OrganizationSchema } from './OrganizationSchema';
```

---

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/seo/WebSiteSchema.tsx` | Homepage WebSite schema with SearchAction |
| `src/components/seo/BreadcrumbSchema.tsx` | Reusable breadcrumb navigation schema |
| `src/components/seo/OrganizationSchema.tsx` | Organization identity schema |

## Files to Edit
| File | Changes |
|------|---------|
| `src/components/seo/index.ts` | Export new schema components |
| `src/components/seo/ProductJsonLd.tsx` | Add aggregateRating support |
| `src/pages/Finder.tsx` | Add WebSiteSchema and OrganizationSchema |
| `src/pages/Brands.tsx` | Add ItemListSchema with brand data |
| `src/pages/FilamentDetail.tsx` | Add BreadcrumbSchema |
| `src/pages/PrinterDetail.tsx` | Add BreadcrumbSchema |
| `src/pages/BrandDetail.tsx` | Add BreadcrumbSchema |

---

## Technical Details

### Schema.org Vocabulary Used
- **WebSite**: Site identity with search capability
- **SearchAction**: Enables sitelinks search box in Google
- **Organization**: Business identity
- **BreadcrumbList**: Navigation hierarchy
- **Product** (existing): Enhanced with AggregateRating
- **ItemList** (existing): Brand directory listing

### Validation
All schemas follow Google's Rich Results Test format requirements:
- Proper `@context: "https://schema.org"` declarations
- Required fields populated (name, url, etc.)
- Absolute URLs used throughout
- Proper nesting of related types

### Search Action URL Pattern
The homepage uses `searchTerm` as the query parameter:
```
https://filascope.com/?searchTerm={search_term_string}
```
This matches the existing filter state in Finder.tsx.
