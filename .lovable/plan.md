

# Fix QIDI Tech Regional Store Configuration in Edge Functions

## Problem
Three Edge Function files only map QIDI to US + EU (2 regions), while all other major brands have full 5-region coverage. The US domain is also wrong (`qidi3d.com` instead of `us.qidi3d.com`). This causes CA, UK, and AU syncs to fail silently.

## Changes

### File 1: `supabase/functions/sync-regional-prices/index.ts` (lines 51-54)

Replace the QIDI entry in `BRAND_REGIONAL_DOMAINS` with all 5 regions and fix the US domain:

```typescript
'qidi': {
  US: 'us.qidi3d.com',
  CA: 'ca.qidi3d.com',
  UK: 'uk.qidi3d.com',
  EU: 'eu.qidi3d.com',
  AU: 'au.qidi3d.com'
},
```

### File 2: `supabase/functions/sync-brand-products/index.ts` (lines 75-78)

Same fix -- replace the QIDI entry with all 5 regions:

```typescript
'qidi': {
  US: 'us.qidi3d.com',
  CA: 'ca.qidi3d.com',
  UK: 'uk.qidi3d.com',
  EU: 'eu.qidi3d.com',
  AU: 'au.qidi3d.com'
},
```

### File 3: `supabase/functions/_shared/printer-price-extraction.ts`

**A) REGION_SPOOF_HEADERS** (after line 1077) -- add CA, UK, AU spoof headers following the same pattern as Elegoo/Anycubic:

```typescript
'ca.qidi3d.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '24.48.0.1' },
'uk.qidi3d.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '178.79.163.0' },
'au.qidi3d.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
```

**B) DOMAIN_REGION_MAP** (after line 1131) -- add CA, UK, AU domain-to-region mappings:

```typescript
'ca.qidi3d.com': 'CA',
'uk.qidi3d.com': 'UK',
'au.qidi3d.com': 'AU',
```

### File 4: `supabase/functions/_shared/regional-fetch.ts` (line 61)

The `KNOWN_GEO_DOMAINS` list has `qidi3d.com` -- this should be updated or supplemented with the regional subdomains so they are recognized as geo-fenced domains.

## Summary

| File | Change | Lines |
|------|--------|-------|
| `sync-regional-prices/index.ts` | Expand QIDI from 2 to 5 regions, fix US domain | 51-54 |
| `sync-brand-products/index.ts` | Same expansion | 75-78 |
| `_shared/printer-price-extraction.ts` | Add 3 spoof headers + 3 domain mappings | ~1077, ~1131 |
| `_shared/regional-fetch.ts` | Ensure QIDI subdomains recognized | ~61 |

After deployment, QIDI will have identical 5-region coverage to Bambu Lab, Elegoo, Creality, and Anycubic. Expected result: up to 35 regional price entries (7 active printers x 5 regions).

