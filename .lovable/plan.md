

# Enhance "Copy Fix Prompt" with Context-Rich Lovable Prompts

## Summary

Upgrade the diagnosis system so that "Copy Fix Prompt" generates dynamic, context-aware prompts containing actual failure details (products, URLs, errors, HTTP status codes, latencies) instead of generic static text. Also add a "Copy All as Lovable Prompt" button.

## Changes

### 1. Edge Function: `supabase/functions/diagnose-sync-failures/index.ts`

- Extend the `Failure` interface with optional fields: `statusCode`, `latencyMs`, `storeKey`
- Add a `contextualPromptParts` field to the `Diagnosis` interface containing `errorPattern`, `edgeFunctionName`, and an array of `failureDetails` (product, region, url, error, statusCode, latencyMs, brand)
- In the grouping loop, collect full failure details (not just product labels) and attach them as `contextualPromptParts` on each diagnosis
- Keep the existing static `suggestedPrompt` untouched as a fallback

### 2. Frontend: `src/pages/admin/PricingData.tsx`

**Update `DiagnosisItem` interface** to include optional `contextualPromptParts` field matching the edge function output.

**Update failure payload** in `handleDiagnoseFailures` to include `statusCode` and `latencyMs` from the `testResults` map, and `storeKey` from the store entry.

**Add `generateLovablePrompt` utility function** that builds a rich Markdown prompt including:
- Error pattern, severity, and count
- Edge function name
- Table of affected products with URLs, regions, errors, HTTP status codes, and latencies
- Diagnosis, suggested fix, and files likely involved
- Graceful fallback to `d.suggestedPrompt` when `contextualPromptParts` is missing

**Update "Copy Fix Prompt" button** to call `generateLovablePrompt(d)` instead of copying `d.suggestedPrompt`. Rename label to "Copy Lovable Prompt".

**Add "Copy All as Lovable Prompt" button** after the diagnosis cards list (visible when there are 2+ diagnoses) that concatenates all prompts with a header including overall health and summary.

## Technical Details

### Edge Function Failure Interface Addition

```text
Failure {
  ...existing fields...
  statusCode?: number    // from TestResult
  latencyMs?: number     // from TestResult  
  storeKey?: string      // store identifier
}
```

### Grouping Enhancement

Instead of only tracking product labels (`string[]`), each group will also track full failure objects. The `contextualPromptParts.failureDetails` array will contain up to 20 entries per group (truncated for very large groups).

### Prompt Format

The generated prompt will be structured Markdown with:
- H2 header with pattern name and count
- "Problem" section with edge function name and severity
- "Affected Products" section with bullet list including URL, error, HTTP status, latency
- "Suggested Fix Direction" section
- "Files Likely Involved" section listing relevant edge functions and UI files

### Fallback Behavior

If `contextualPromptParts` is undefined (e.g., from a cached/old diagnosis), the function falls back to `d.suggestedPrompt` -- preserving backward compatibility.

### Files Modified

| File | Action |
|------|--------|
| `supabase/functions/diagnose-sync-failures/index.ts` | Add fields to Failure/Diagnosis interfaces, populate contextualPromptParts in grouping loop |
| `src/pages/admin/PricingData.tsx` | Add `generateLovablePrompt`, update DiagnosisItem type, update copy button, add "Copy All" button, pass test result data to failures payload |

