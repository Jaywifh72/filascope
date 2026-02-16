

# AI-Powered Failure Diagnosis System for Pricing Data

## Overview

Add a "Diagnose Failures" button to the Pricing Data toolbar that collects failed sync results, sends them to a rules-based edge function for analysis, and displays grouped diagnoses with copy-ready fix prompts in a modal dialog.

## File Changes

### 1. New Edge Function: `supabase/functions/diagnose-sync-failures/index.ts`

A rules-engine edge function (no external AI) that:
- Accepts an array of failure objects (product, region, currency, url, error, brand, extractedPrice, source)
- Matches errors against 8 predefined rules (constraint violations, Firecrawl 500/402, extraction failures, rate limits, missing URLs, auth issues, timeouts)
- Groups similar failures (same error pattern) and counts affected products
- Returns a structured response with: summary string, array of diagnosis objects (pattern, count, severity, diagnosis, suggestedFix, suggestedPrompt, affectedProducts), and overallHealth rating (good/fair/poor)
- No authentication required (admin-only data is sent client-side, no DB access needed)

Add to `supabase/config.toml`:
```toml
[functions.diagnose-sync-failures]
verify_jwt = false
```

### 2. Update: `src/pages/admin/PricingData.tsx`

**New state variables:**
- `diagnosisResult` -- stores the last diagnosis response (also persisted to localStorage)
- `isDiagnosing` -- loading state
- `showDiagnosisModal` -- controls dialog visibility

**New "Diagnose Failures" button** in the toolbar (after "Resync Stale"), visible when any syncResults have `status === 'failed'`:
- Shows count badge: "Diagnose (X failures)"
- Clicking it collects all failed syncResults, maps them to the input format (pulling product name, region, currency, URL, error, brand, etc. from the StoreRow + ProductGroup data), calls the edge function, and stores the result

**New diagnosis modal** using the existing Dialog component:
- Summary banner at top with overall health indicator (colored emoji)
- Each diagnosis group rendered as a Card with:
  - Severity indicator (red border for high, yellow for medium, green for low)
  - Pattern name, count of affected products
  - Diagnosis text and suggested fix
  - "Copy Fix Prompt" button that copies `suggestedPrompt` to clipboard
  - Collapsible list of affected products
- "Retry Transient Failures" button at the bottom that re-syncs products with transient errors (Firecrawl 500, timeouts)
- Result persisted to localStorage under `filascope_last_diagnosis`

### 3. Component Extraction (optional but clean)

The diagnosis modal will be implemented as an inline component within PricingData.tsx to keep it contained, since it needs access to syncResults state and the syncSinglePrice callback.

## Technical Details

### Rules Engine Pattern Matching

Each rule checks `error.includes(pattern)` and returns severity + diagnosis + fix + prompt:

| Rule | Pattern | Severity |
|------|---------|----------|
| Constraint violation | "check constraint" + "price" | high |
| Firecrawl 500 | "Firecrawl error: 500" or "502" or "503" | medium |
| Price extraction | "Could not extract price" | medium |
| Firecrawl credits | "Firecrawl error: 402" | high |
| Rate limited | "Rate limited" | low |
| No URL | "No product URL" | medium |
| Auth issue | "Unauthorized" or "Admin role" | high |
| Timeout | "timeout" (case-insensitive) | medium |
| Default | anything else | medium |

### Grouping Logic

Failures are grouped by their matched rule pattern. If 5+ products share a pattern, they're listed as "X products affected" with a collapsible detail list.

### Retry Logic

The "Retry Transient Failures" button filters for patterns marked as transient (Firecrawl 500, timeouts) and calls `syncSinglePrice` for each affected store, reusing existing batch logic.

### LocalStorage Persistence

On diagnosis completion, save to `localStorage.setItem('filascope_last_diagnosis', JSON.stringify({ result, timestamp }))`. On mount, load it back so it survives refreshes. Clear it when syncResults are reset.

## Summary

| File | Action |
|------|--------|
| `supabase/functions/diagnose-sync-failures/index.ts` | Create new edge function with rules engine |
| `supabase/config.toml` | Add `verify_jwt = false` entry |
| `src/pages/admin/PricingData.tsx` | Add diagnose button, modal, state, localStorage persistence |

