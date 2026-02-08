

# Buying Guide Content Pages -- SEO Landing Pages

## Overview

Create a template-driven buying guide system under `/guides/` that dynamically pulls filament data from the database, displays regional pricing, and generates rich SEO structured data. Each guide combines editorial content blocks with auto-populated, database-driven product rankings.

## Current State

The site already has:
- A **Learning Center** at `/learn` with 5 static guide content pages (e.g., "PLA vs PETG vs ABS", "Best Filament for Beginners")
- A `GuideDetail.tsx` renderer that maps slugs to hardcoded React content components
- Existing SEO components: `ProductJsonLd`, `ItemListSchema`, `FAQSchema`, `BreadcrumbSchema`, `CanonicalLink`
- Regional pricing infrastructure via `useRegionalPrice` hook and `useRegion` context
- A unified scoring system (`calculateUnifiedScore`) for filament rankings
- Two standalone guide pages at `/guides/print-settings` and `/guides/troubleshooting`

The current guides are **entirely static** -- product recommendations are hardcoded with fake IDs and prices. The new system will pull real products from the database with live regional pricing.

## Architecture

### Template System

Rather than creating 6 separate page components with duplicated logic, the plan introduces a **reusable guide template** system:

1. **`BuyingGuideTemplate`** -- A shared layout component handling: hero section, breadcrumbs, table of contents sidebar, SEO metadata (Article JSON-LD), product card grid with regional pricing, and CTA sections.

2. **`useGuideFilaments` hook** -- A data-fetching hook that accepts filter criteria (material type, sort field, limit) and returns scored, regionally-priced filament data from the database.

3. **Guide config objects** -- Each guide is defined by a configuration object specifying its filters, editorial blocks, and SEO metadata. No separate page components needed for material-specific guides.

### Data Flow

```text
Guide Config (filters, editorial content)
        |
        v
useGuideFilaments(material: "PLA", limit: 10)
        |
        v
Supabase query --> filaments table
        |
        v
Client-side: calculateUnifiedScore() + useRegionalPrice()
        |
        v
BuyingGuideTemplate renders ranked cards with live pricing
```

## Implementation Plan

### 1. Data Hook: `useGuideFilaments`

**File: `src/hooks/useGuideFilaments.ts`** (new)

A React Query-based hook that fetches filaments matching guide criteria:
- Accepts: `material` filter (e.g., "PLA"), `requireTD` boolean (for HueForge guide), `limit` (default 10)
- Queries the `filaments` table selecting: id, product_title, vendor, material, color_family, featured_image, product_handle, variant_price, net_weight_g, regional price columns, transmission_distance, scoring fields (ease_of_printing_score, strength_index, printability_index, etc.)
- Filters out items without prices or images for guide quality
- Returns data with `calculateUnifiedScore` applied to each item
- Sorts by score descending (for "best" guides) or by TD ascending (for HueForge guide)

### 2. Guide Product Card: `GuideProductCard`

**File: `src/components/guides/GuideProductCard.tsx`** (new)

A purpose-built card for buying guides showing:
- Rank number (1-10) with medal styling for top 3
- Product image, name (cleaned via `cleanFilamentDisplayName`), brand logo
- Material badge
- FilaScore with breakdown tooltip (reuse `calculateUnifiedScore`)
- Regional price via `useRegionalPrice` hook with converted/native indicator
- "Why we picked this" blurb (generated from score factors: e.g., "Top-tier data completeness, verified brand, strong regional availability")
- Pros/cons derived from filament properties (e.g., pro: "Wide temp range 190-230C", con: "No TDS available")
- "View Details" and "Buy" CTAs linking to product detail and affiliate URL

### 3. Comparison Table Component: `GuideComparisonTable`

**File: `src/components/guides/GuideComparisonTable.tsx`** (new)

A responsive comparison table at the top of "Best X" guides:
- Columns: Rank, Product, Score, Price (/kg), Temp Range, Key Strength
- Sticky header on scroll
- Highlighted winner row (rank 1)
- Price shown in user's regional currency
- Clicking a row scrolls to the detailed card below

### 4. VS Comparison Component: `GuideVSComparison`

**File: `src/components/guides/GuideVSComparison.tsx`** (new)

For the "PLA vs PETG" guide, a side-by-side comparison layout:
- Two columns with material headers
- Property rows: ease of printing, strength, heat resistance, flexibility, price range, best use case
- Visual indicators (checkmarks, star ratings, color-coded better/worse)
- "Best Products" sub-section for each material pulling top 3 from the database
- "Verdict" section with recommendation logic

### 5. Buying Guide Template

**File: `src/components/guides/BuyingGuideTemplate.tsx`** (new)

The main reusable template component:
- Props: `config` object containing title, description, SEO metadata, editorial sections, filter criteria
- Renders: `<Helmet>` with Article JSON-LD structured data, canonical URL, Open Graph tags
- Layout: Hero with breadcrumbs, comparison table, editorial intro, ranked product cards, editorial sections interspersed, FAQ section, related guides, CTA
- Table of Contents sidebar (reuse existing TOC pattern from `GuideDetail.tsx`)
- "Last updated" timestamp auto-derived from data freshness

### 6. Guide Configuration and Pages

**File: `src/components/guides/guideConfigs.ts`** (new)

Central configuration file defining all buying guides:

- **`best-pla-filaments`**: Filters `material = 'PLA'`, sorts by score, top 10. Editorial: Why PLA matters, what to look for, temperature tips.
- **`best-petg-filaments`**: Same pattern for PETG. Editorial: When to choose PETG over PLA, functional parts focus.
- **`best-abs-filaments`**: Same for ABS. Editorial: Enclosure requirements, vapor smoothing, safety notes.
- **`pla-vs-petg`**: Uses `GuideVSComparison` layout. Pulls top 3 of each material. Editorial: Use case decision tree.
- **`beginners-guide`**: No material filter -- curated editorial with links to wizard, product pages, other guides. Pulls top 5 beginner-friendly (PLA, highest ease score).
- **`hueforge-filaments`**: Filters `transmission_distance IS NOT NULL`, sorts by TD. Editorial: What is TD, how to measure, TD ranges explained, best picks by TD range (low/medium/high).

Each config includes:
- `slug`, `title`, `description`, `category`
- `seoTitle`, `seoDescription`, `keywords`
- `filters`: `{ material?, requireTD?, sortBy, limit }`
- `editorialSections`: Array of `{ heading, content, position }` (position: before/after product list)
- `faqs`: Array for FAQ schema

**File: `src/pages/BuyingGuide.tsx`** (new)

A single page component that:
- Reads `:slug` from URL params
- Looks up the matching config from `guideConfigs`
- Passes config to `BuyingGuideTemplate`
- Shows 404 for unknown slugs

### 7. SEO: Article Structured Data

**File: `src/components/seo/ArticleSchema.tsx`** (new)

New Article JSON-LD component for guide pages:
- `@type: "Article"` with `headline`, `description`, `datePublished`, `dateModified`
- `author`: `{ "@type": "Organization", "name": "FilaScope" }`
- `publisher` with logo
- `mainEntityOfPage` with canonical URL
- Integrates with existing `ItemListSchema` for the product rankings within each guide

### 8. Route Registration and Navigation

**File: `src/App.tsx`** (edit)

Add route: `<Route path="/guides/:slug" element={<BuyingGuide />} />`

This single route handles all 6 guide pages via the slug parameter.

**File: `src/pages/LearningCenter.tsx`** (edit)

Add the 6 new guides to the `GUIDES` array with appropriate metadata:
- Update `publishedAt` dates to 2026
- Mark the "Best PLA" and "PLA vs PETG" guides as `featured`
- Add a new category: `'buying-guide'` with a shopping bag icon and amber color theme

Also update `GuideDetail.tsx` to check for buying guide slugs and redirect to `/guides/:slug` so users arriving via `/learn/best-pla-filaments` get redirected properly.

### 9. Homepage Cross-links

**File: `src/components/HeroSection.tsx`** (edit -- minimal)

Add a "Buying Guides" link in the existing quick actions or resource links section, pointing to `/learn` with the buying-guide category pre-filtered.

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useGuideFilaments.ts` | Create | Data hook for fetching filtered, scored filaments |
| `src/components/guides/GuideProductCard.tsx` | Create | Ranked product card with regional pricing |
| `src/components/guides/GuideComparisonTable.tsx` | Create | Top comparison table for "Best X" guides |
| `src/components/guides/GuideVSComparison.tsx` | Create | Side-by-side layout for "X vs Y" guides |
| `src/components/guides/BuyingGuideTemplate.tsx` | Create | Reusable guide page template |
| `src/components/guides/guideConfigs.ts` | Create | Central guide configuration (all 6 guides) |
| `src/pages/BuyingGuide.tsx` | Create | Single route handler for all buying guides |
| `src/components/seo/ArticleSchema.tsx` | Create | Article JSON-LD structured data |
| `src/components/seo/index.ts` | Edit | Export new ArticleSchema |
| `src/App.tsx` | Edit | Register `/guides/:slug` route |
| `src/pages/LearningCenter.tsx` | Edit | Add 6 new guide entries, new category |
| `src/pages/GuideDetail.tsx` | Edit | Redirect buying guide slugs to `/guides/` |

No database changes required -- all data is already in the `filaments` table with scores, prices, and regional columns.

## Key Technical Decisions

1. **Single route vs separate pages**: One `BuyingGuide.tsx` component with config-driven rendering avoids code duplication across 6 nearly identical pages.

2. **Client-side scoring vs pre-computed**: Uses existing `calculateUnifiedScore` client-side rather than adding a database column. This keeps rankings fresh as data changes without migration overhead.

3. **Editorial content storage**: Initially hardcoded in `guideConfigs.ts` as JSX/string content. This avoids needing a CMS table now while keeping the door open for database-stored content later.

4. **Regional pricing integration**: Each product card uses `useRegionalPrice` individually (same pattern as `FilamentCard`), ensuring correct currency display, conversion indicators, and regional URL routing.

5. **Article schema over Product schema**: Guides use `Article` JSON-LD (not `Product`) since Google treats buying guides as editorial content. The individual product cards within each guide link to their detail pages which already have `Product` schema.

