

## Update robots.txt with Additional AI Crawler Permissions

### Current State
The `robots.txt` is served dynamically via the `serve-robots` Edge Function at `supabase/functions/serve-robots/index.ts` (not a static file). Several of the requested bots **already exist** in the current configuration.

### Analysis: Existing vs New Bots

| Bot | Status |
|-----|--------|
| Google-Extended | Already exists (line 52) |
| Applebot-Extended | Already exists (line 49) |
| cohere-ai | Already exists (line 58) |
| meta-externalagent | Already exists (line 61, lowercase) |
| OAI-SearchBot | **New — needs adding** |
| CCBot | **New — needs adding** |
| DeepSeekBot | **New — needs adding** |
| Amazonbot | **New — needs adding** |
| YouBot | **New — needs adding** |
| AI2Bot | **New — needs adding** |

### Changes

**File:** `supabase/functions/serve-robots/index.ts`

1. Fix casing of `meta-externalagent` to `Meta-ExternalAgent` to match the canonical bot name
2. Add 6 new User-agent blocks (OAI-SearchBot, CCBot, DeepSeekBot, Amazonbot, YouBot, AI2Bot) before the Sitemap line
3. Keep all existing blocks and the Sitemap line intact

The edge function will auto-deploy after the change. No other files are modified.

### Verification
After deploy, visit `https://filascope.com/robots.txt` to confirm all 16 User-agent blocks are present with `Allow: /`.

