
# Deploy SEO Edge Functions

## Summary
Three edge functions (`serve-robots`, `sitemap-xml`, `prerender`) exist in the codebase but are not deployed. The `sitemap-generator` function also exists and should be deployed. All four need to be deployed, and one is missing its `config.toml` entry.

## What Needs to Happen

### Step 1: Add missing config.toml entry for `serve-robots`
The `serve-robots` function is missing from `supabase/config.toml`. It must be added with `verify_jwt = false` since crawlers (Googlebot, etc.) cannot authenticate. The other three functions (`sitemap-xml`, `prerender`, `sitemap-generator`) already have config entries.

### Step 2: Deploy all four functions
Deploy these functions using the deployment tool:
- `serve-robots` -- serves robots.txt, llms.txt, and IndexNow key
- `sitemap-xml` -- generates sitemap index XML
- `sitemap-generator` -- generates full dynamic sitemap with DB queries
- `prerender` -- prerender service for SEO (serves sub-sitemaps and crawler-friendly HTML)

### What Will NOT Change
- Static fallback files (`public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`) remain untouched
- `public/_redirects` remains as-is (SPA catch-all only) -- no redirect rules will be added in this step
- No other pages or components will be modified

## Technical Details

**Environment variables**: All functions use only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are automatically available in the edge function runtime. No additional secrets are needed.

**Config change** (only addition):
```toml
[functions.serve-robots]
verify_jwt = false
```

**Functions to deploy**: `serve-robots`, `sitemap-xml`, `sitemap-generator`, `prerender`

After deployment, the functions will be accessible at:
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/serve-robots`
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml`
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-generator`
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender`

Redirect rules to route `/robots.txt` and `/sitemap.xml` to these functions can be added later as a separate step once deployment is confirmed working.
