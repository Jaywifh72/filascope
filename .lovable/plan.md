

# Enhance Homepage Search to Support Brand + Material Queries

## Problem

The autocomplete dropdown (used on homepage and header search) only queries the `product_title` column via `ILIKE`. When a user types "Bambu Lab PLA", no product has that exact string in its title, so zero results appear. Meanwhile, the full search results page already works correctly because it uses full-text search across multiple fields.

## Root Cause

The `useSearchAutocomplete` hook (line 108-111) queries:
```
.ilike("product_title", `%${q}%`)
```

This misses matches where the query spans multiple columns (e.g., "Bambu Lab" is in `vendor`, "PLA" is in `material`).

## Solution

Modify the **filaments query** in `useSearchAutocomplete.ts` to use Postgres full-text search (`textSearch` on the existing `search_vector` column) with an `ILIKE` fallback, matching the same approach used by `search_filaments_ranked`.

### Changes

#### 1. `src/hooks/useSearchAutocomplete.ts` -- Filaments query (lines 97-120)

Replace the single `.ilike("product_title", ...)` with a two-step approach:

1. **Primary**: Use `.textSearch('search_vector', query, { type: 'websearch' })` which matches against the pre-built tsvector (includes `product_title`, `vendor`, `material`, `finish_type`, `color_family`, `display_name`).
2. **Fallback**: If FTS returns zero results (e.g., partial words that don't tokenize well), fall back to an `.or()` filter across `product_title`, `vendor`, `material`, and `display_name` using `ILIKE`.

This ensures "Bambu Lab PLA" matches filaments where vendor="Bambu Lab" AND material="PLA".

#### 2. `src/hooks/useSearchSuggestions.ts` -- Product suggestions query (lines 156-161)

Apply the same fix: replace `.ilike("product_title", ...)` with `.or()` across `product_title`, `vendor`, `material`, and `display_name`. This hook is used in the older search suggestion flow.

#### 3. `src/components/projects/FilamentSearchDialog.tsx` -- Project filament search (lines 42-45)

Same pattern: expand the `ILIKE` to an `.or()` filter so the project filament picker also benefits from multi-field search.

### No database changes needed

The `search_vector` tsvector column already indexes `vendor`, `material`, `product_title`, `finish_type`, `color_family`, and `display_name`. No new indexes or migrations are required.

### No UI changes

The autocomplete dropdown structure, styling, and grouping logic remain identical. Only the underlying query changes.

## Technical Detail

The filaments query in `useSearchAutocomplete.ts` will change from:

```typescript
.ilike("product_title", `%${q}%`)
```

To:

```typescript
.or(`product_title.ilike.%${q}%,vendor.ilike.%${q}%,material.ilike.%${q}%,display_name.ilike.%${q}%`)
```

For multi-word queries like "Bambu Lab PLA", the tokens will also be split and each matched individually using `.textSearch()` first, falling back to the `.or()` approach.

