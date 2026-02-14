
# Fix: OG Tag Override and Canonical URL Mismatch on Product Pages

## Issue 1: OG Tags Not Overriding

**Root Cause**: `index.html` contains hardcoded OG meta tags (lines 50-54) that include `og:title`, `og:type`, `og:url`, `og:image`, and `og:description` with homepage values. `react-helmet-async` should override these, but the issue is that the `index.html` meta tags exist in the raw HTML, and `react-helmet-async` can only manipulate tags it "owns". Since these are raw HTML tags not managed by Helmet, they persist alongside the Helmet-injected ones, causing duplicates or the raw HTML tag winning.

**Fix**: Remove the page-specific OG tags from `index.html` and move them into the homepage component (Finder.tsx) via Helmet. The `index.html` should only contain truly generic fallbacks that every page shares (like `og:site_name`). Specifically:

- **Remove from `index.html`**: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:image`, `twitter:image:alt`
- **Add to Finder.tsx**: A Helmet block with these same homepage-specific OG tags
- **Keep in `index.html`**: `twitter:card`, `twitter:site`, and `og:site_name` (these are truly global)

This way, when `ProductSEO` renders its Helmet with `og:title`, `og:type="product"`, `og:image`, etc., there are no competing raw HTML tags to conflict.

## Issue 2: Canonical URL Mismatch

**Root Cause**: In `FilamentDetail.tsx` line 763:
```
canonicalUrl={`/filament/${displayFilament.product_handle || id}`}
```

`product_handle` is the Shopify product handle (e.g., `pla-basic-filament`), NOT the SEO slug used in the URL (e.g., `bambu-lab-pla-basic`). The URL uses the route parameter `id` which was resolved by `useFilamentBySlug` -- it could be the SEO slug or a UUID that got replaced. The canonical should always match the URL the user is actually on.

**Fix**: Use the route parameter `id` (the slug from the URL) as the canonical, not `product_handle`:
```
canonicalUrl={`/filament/${id}`}
```

This ensures the canonical always matches the URL. If the user arrived via UUID and the URL was replaced via `history.replaceState`, the `id` param still reflects the original UUID -- but since `CanonicalLink` already skips UUIDs (line 28 of CanonicalLink.tsx), this is safe. For slug-based URLs (the normal case), the canonical will correctly match.

Additionally, the same fix needs to apply to the `ProductJsonLd` component on line 785:
```
url={`https://filascope.com/filament/${id}`}
```
instead of using `product_handle`.

## Technical Changes

### File 1: `index.html`
Remove these meta tags (lines 49-63):
- `og:title` (homepage value)
- `og:description` (homepage value)
- `og:type` ("website")
- `og:url` (homepage URL)
- `og:image` (generic og-image.png)
- `og:image:width`, `og:image:height`, `og:image:alt`
- `twitter:image`, `twitter:image:alt`

Keep:
- `twitter:card` = "summary_large_image" (global default)
- `twitter:site` = "@FilaScope" (global default)

### File 2: `src/pages/Finder.tsx`
Add a Helmet block with the homepage-specific OG tags that were removed from `index.html`. This ensures the homepage still has correct OG tags via Helmet.

### File 3: `src/pages/FilamentDetail.tsx`
- Line 763: Change `canonicalUrl` from `displayFilament.product_handle || id` to just `id`
- Line 785: Change `url` from `displayFilament.product_handle || displayFilament.id` to `id`

### File 4: `src/components/seo/CanonicalLink.tsx`
No changes needed -- it already skips UUID paths and sets canonical + og:url for non-UUID paths. Since product pages render `ProductSEO` which sets its own canonical and og:url, the `CanonicalLink` values get overridden by Helmet's "last rendered wins" rule for same-property tags.
