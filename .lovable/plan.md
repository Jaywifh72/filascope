

## Dynamic Open Graph Image Generation

### Overview
Create a backend function that generates branded PNG images on-the-fly for social media previews, then wire up all page-level SEO components and the prerender function to use dynamic OG image URLs instead of a static fallback.

### Architecture

The system uses Supabase's recommended `og_edge` library (wraps Satori internally) which accepts JSX-like markup and returns a PNG `ImageResponse`. A single edge function handles all OG image types via query parameters.

```text
Social Platform Request
        |
        v
  /og-image?type=product&title=...&subtitle=...&price=...&color=...
        |
        v
  Edge Function (og_edge)
        |
        v
  1200x630 PNG response (cached 7 days)
```

### Implementation Steps

#### 1. Create edge function `supabase/functions/og-image/index.tsx`

- Uses `ImageResponse` from `https://deno.land/x/og_edge/mod.ts` and React from `https://esm.sh/react@18.2.0`
- Accepts query params: `type` (product/brand/guide/default), `title`, `subtitle`, `price`, `color` (hex accent), `image` (product image URL)
- Generates 1200x630px PNG with:
  - Dark background (#0a0e17)
  - FilaScope text logo top-left in white
  - Title in large white text (max ~60 chars, truncated with ellipsis)
  - Subtitle and price in teal accent (#00d4aa)
  - Colored accent bar/gradient derived from the `color` param (e.g., filament color)
  - Product image on the right side if provided (fetched via URL)
- Returns with headers: `Content-Type: image/png`, `Cache-Control: public, max-age=604800` (7 days)
- CORS headers for cross-origin access
- Note: file extension is `.tsx` to support JSX syntax required by og_edge

#### 2. Add config entry in `supabase/config.toml`

```toml
[functions.og-image]
verify_jwt = false
```

Public access since crawlers/social platforms must fetch without auth.

#### 3. Create helper utility `src/lib/ogImageUrl.ts`

A small utility to build the OG image URL cleanly:

```typescript
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function buildOgImageUrl(params: {
  type: 'product' | 'brand' | 'guide' | 'default';
  title: string;
  subtitle?: string;
  price?: string;
  color?: string;
  image?: string;
}): string {
  const url = new URL(`${FUNCTIONS_URL}/og-image`);
  url.searchParams.set('type', params.type);
  url.searchParams.set('title', params.title);
  if (params.subtitle) url.searchParams.set('subtitle', params.subtitle);
  if (params.price) url.searchParams.set('price', params.price);
  if (params.color) url.searchParams.set('color', params.color);
  if (params.image) url.searchParams.set('image', params.image);
  return url.toString();
}
```

#### 4. Update `src/components/seo/ProductSEO.tsx`

- Build a dynamic OG image URL using the helper:
  ```
  type=product, title={brand} {name}, subtitle={material}, price=From ${price}, color={colorHex}, image={featuredImage}
  ```
- Always set `og:image` to this dynamic URL (falling back to static product image if edge function URL would be too long)
- `twitter:card` already set to `summary_large_image` -- no change needed

#### 5. Update `src/components/seo/BrandSEO.tsx`

- Build OG image URL:
  ```
  type=brand, title={brandName} Filaments, subtitle={productCount} products, image={logoUrl}
  ```
- Set `og:image` to dynamic URL instead of only showing when `image` prop exists

#### 6. Update guide/learn page SEO (if applicable)

- For guide pages that use Helmet directly, add:
  ```
  type=guide, title={guideTitle}
  ```

#### 7. Update `supabase/functions/prerender/index.ts`

Update the `ogImage` field in each route handler to use the edge function URL instead of the static fallback:

- `filamentPage`: Build OG URL with product details (title, brand, price, color, featured image)
- `brandPage`: Build OG URL with brand name and product count
- `guidePage`: Build OG URL with guide title
- `printerPage`: Build OG URL with printer name, brand, price
- Other pages: Keep static `/og-image.png` default

The `buildHtml` function already uses `data.ogImage` with fallback to `/og-image.png`, so just setting the right value in each handler is sufficient.

### Technical Details

- **og_edge library**: Supabase's officially recommended approach. Uses Satori under the hood to convert React/JSX to SVG, then renders to PNG. No native dependencies needed.
- **Font**: og_edge includes a default font. No custom font file needed for the initial implementation.
- **Caching**: 7-day `Cache-Control` plus `CDN-Cache-Control` for edge caching. Social platforms cache images aggressively anyway.
- **Image fetching**: When `image` param is provided, the function fetches the image bytes and embeds it in the rendered output. Includes a timeout to avoid slow responses.
- **URL length safety**: OG image URLs are built with encoded query params. Titles are truncated to prevent excessively long URLs.
- **File extension**: The edge function file will be `index.tsx` (not `.ts`) because og_edge requires JSX syntax. This is supported by Deno.

### Files to Create
- `supabase/functions/og-image/index.tsx` -- the image generation function
- `src/lib/ogImageUrl.ts` -- client-side URL builder utility

### Files to Modify
- `supabase/config.toml` -- add og-image function config
- `src/components/seo/ProductSEO.tsx` -- use dynamic OG image
- `src/components/seo/BrandSEO.tsx` -- use dynamic OG image
- `supabase/functions/prerender/index.ts` -- use dynamic OG URLs in server-rendered HTML

