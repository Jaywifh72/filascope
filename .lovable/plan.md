

## Prerender Edge Function for SEO Crawlers

This creates a backend function that intercepts search engine crawlers and serves them fully-formed HTML with correct titles, descriptions, Open Graph tags, and JSON-LD schema markup -- solving the core problem that crawlers currently see only the generic SPA shell.

---

### How It Works

When a crawler (Googlebot, Bingbot, etc.) requests any FilaScope page, the edge function:
1. Detects the crawler user agent
2. Matches the URL path to a route pattern
3. Queries the database for page-specific data (product name, brand, price, specs, etc.)
4. Returns complete HTML with all SEO metadata injected server-side
5. Non-crawler requests get a 302 redirect to the normal SPA

---

### Files to Create

**1. `supabase/functions/prerender/index.ts`** -- Main entry point
- CORS handling and crawler user agent detection
- Route matching (delegates to route handlers)
- Returns prerendered HTML for crawlers, 302 redirect for regular users
- Cache headers: `Cache-Control: public, max-age=3600, s-maxage=3600` for crawler responses

**2. `supabase/functions/prerender/route-handlers.ts`** -- Route matching and data fetching
- Pattern matching for all route types: `/`, `/filament/{slug}`, `/brands`, `/brands/{slug}`, `/printers`, `/printers/{slug}`, `/deals`, `/guides/{slug}`, `/learn`, `/compare`
- Database queries using Supabase service role client
- For filament pages: queries `filaments` table by `product_handle` (or UUID fallback)
- For brand pages: queries `automated_brands` by `brand_slug`
- For printer pages: queries `printers` by `printer_id` (or UUID), joins `printer_brands` for brand name
- Returns structured page data objects to the template generator

**3. `supabase/functions/prerender/seo-templates.ts`** -- HTML template generation
- Generates complete HTML documents with:
  - `<title>` and `<meta name="description">` using the templates from the requirements
  - Open Graph tags (og:title, og:description, og:image, og:url, og:type)
  - Twitter Card tags
  - Canonical URL (without query params)
  - JSON-LD structured data (Product, Organization, Article, BreadcrumbList, WebSite, FAQPage)
  - Minimal semantic HTML body content (h1, breadcrumb nav, key text) for crawler content extraction
  - `<noscript>` fallback message
  - References to the same CSS/JS bundles as index.html
- Template functions per route type: `buildProductHtml()`, `buildBrandHtml()`, `buildPrinterHtml()`, etc.

---

### Crawler Detection

User agents detected: Googlebot, Bingbot, Twitterbot, facebookexternalhit, LinkedInBot, Slackbot, WhatsApp, Discordbot, Applebot, DuckDuckBot, YandexBot, archive.org_bot, Slurp

---

### Route Handlers Detail

| Route Pattern | DB Query | Schema Markup |
|---|---|---|
| `/` | None (static) | WebSite + Organization |
| `/filament/{slug}` | `filaments` by product_handle/id | Product + BreadcrumbList |
| `/brands` | Count from automated_brands | BreadcrumbList |
| `/brands/{slug}` | `automated_brands` by brand_slug | Organization + BreadcrumbList |
| `/printers` | Count from printers | BreadcrumbList |
| `/printers/{slug}` | `printers` + `printer_brands` | Product + BreadcrumbList |
| `/deals` | Count active deals | BreadcrumbList |
| `/guides/{slug}` | Static guide metadata map | Article + BreadcrumbList |
| `/learn` | None (static) | BreadcrumbList |
| `/compare` | None (static) | BreadcrumbList |

---

### Configuration

Add to `supabase/config.toml`:
```toml
[functions.prerender]
verify_jwt = false
```

This must be public (no JWT) since crawlers do not authenticate.

---

### Technical Details

- The edge function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables (both already available in edge function runtime)
- The HTML body includes minimal semantic content: an `<h1>` with the page title, a `<nav>` breadcrumb, and a paragraph of descriptive text -- enough for crawlers to extract meaningful content
- For the filament Product schema: includes `name`, `brand`, `material`, `offers` (AggregateOffer with price), `sku` (product_handle), and `image`
- The function does NOT modify any existing React components or pages
- Guide metadata is stored as a static map in the route handler (matching the existing `GUIDE_SLUGS` pattern from the sitemap function) since guides are not database-driven
- All responses include proper CORS headers for consistency

### Important Limitation

This function needs to be invoked by a reverse proxy or CDN rule that routes crawler traffic to it. The function itself cannot intercept traffic to the SPA directly -- it must be called explicitly. The typical deployment pattern is:
- Configure a Cloudflare Worker, Vercel middleware, or similar edge proxy to check user agents
- If crawler detected, proxy the request to this edge function
- Otherwise, serve the normal SPA

Alternatively, the function can be called directly at its edge function URL for testing and validation.

