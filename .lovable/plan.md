

## Fix robots.txt and sitemap.xml Routing

### Current State (Verified)

- `robots.txt`: **Works on production** (Lovable hosting serves `public/` static files correctly), but shows the old `Sitemap: https://filascope.com/sitemap.xml` because the latest code hasn't been published
- `sitemap.xml`: **404 on production** because no static file exists at `public/sitemap.xml` -- the SPA fallback intercepts and renders the React 404 page
- The codebase already has `public/robots.txt` updated to point to the edge function URL (`https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml`)

### Solution

The fix requires only **one code change + one publish**:

#### 1. Already Done (Previous Edit)

`public/robots.txt` already points the Sitemap directive to the edge function URL. Google, Bing, and all major crawlers read the `Sitemap:` line from robots.txt and follow that URL -- it does NOT need to be at `/sitemap.xml` on the domain. This is standard practice and explicitly supported by the Sitemaps protocol.

#### 2. Publish the App

Publishing deploys the updated `public/robots.txt` to production, which changes the Sitemap line from the broken `https://filascope.com/sitemap.xml` to the working edge function URL.

#### 3. What About /sitemap.xml on the Domain?

No action needed. The `/sitemap.xml` path will continue to return the SPA 404 page, but this is harmless because:
- Crawlers discover the sitemap via `robots.txt`, not by guessing `/sitemap.xml`
- Google Search Console accepts any valid URL for sitemap submission (you can submit the edge function URL directly)
- The `Sitemap:` directive in robots.txt is the canonical way to declare sitemap locations

### What This Does NOT Fix

The `public/robots.txt` update is the only code change needed. After publishing:

| URL | Status | Content |
|-----|--------|---------|
| `/robots.txt` | 200 OK, text/plain | Correct robots directives + edge function sitemap URL |
| Edge function sitemap URL | 200 OK, application/xml | Full XML sitemap with all filaments, brands, printers, guides |
| `/sitemap.xml` | 200 OK (SPA 404 page) | React 404 component (harmless -- crawlers won't hit this) |

### Technical Notes

- No Vite config changes needed -- Lovable hosting already serves `public/` files with priority over the SPA fallback
- No React Router changes needed -- robots.txt is handled as a static file, not a route
- No index.html script injection needed
- No build-time sitemap generation needed -- the edge function generates it dynamically with fresh data

### Action Required

Publish the app to deploy the updated robots.txt to production.

