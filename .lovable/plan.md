
# Plan: Convert Printer URLs from UUID to SEO-Friendly Slugs

## ✅ COMPLETED
Convert printer detail page URLs from UUID format (`/printers/f9bc2b59-33e8-4fce-84f2-979e010f5d69`) to SEO-friendly slug format (`/printers/bambu-lab-a1`) to match the filament pages pattern.

## Current State Analysis

### What Already Exists
- **`printer_id` column**: The `printers` table already has a `printer_id` text column containing slug-like values
- **Dual lookup support**: `PrinterDetail.tsx` already supports looking up by both UUID and `printer_id`
- **Inconsistent formatting**: Current `printer_id` values use a mix of underscores (`bambu_lab_a1`) and hyphens (`creality-ender-3-v3`)

### What's Missing
- All listing links still use UUID (`printer.id`) instead of slug
- No automatic URL rewriting from UUID to slug like filaments have
- No slug generation utilities for printers
- Slugs aren't SEO-optimized (should be `brand-model` format with hyphens)

---

## Implementation Plan

### Phase 1: Database Migration

#### 1.1 Add Unique Constraint and Normalize Slugs
Create a migration to:
- Normalize all existing `printer_id` values to use hyphens instead of underscores
- Add a unique constraint on `printer_id` to prevent duplicates
- Create a function to generate standardized slugs

```sql
-- Normalize existing printer_id values (underscores → hyphens)
UPDATE printers 
SET printer_id = REPLACE(printer_id, '_', '-')
WHERE printer_id LIKE '%_%';

-- Add unique constraint
ALTER TABLE printers 
ADD CONSTRAINT printers_printer_id_unique UNIQUE (printer_id);
```

#### 1.2 Create Slug Generation Function
Create a database function to generate SEO slugs from brand + model:

```sql
CREATE OR REPLACE FUNCTION generate_printer_slug(
  p_brand_name TEXT,
  p_model_name TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(p_brand_name, '') || '-' || COALESCE(p_model_name, ''),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 One-Time Data Migration
Regenerate all slugs with consistent format:

```sql
UPDATE printers p
SET printer_id = generate_printer_slug(
  (SELECT brand FROM printer_brands WHERE id = p.brand_id),
  p.model_name
)
WHERE printer_id IS NOT NULL;

-- Handle duplicates by appending variant name or numeric suffix
-- (Custom migration script needed for edge cases)
```

---

### Phase 2: Frontend - Utility Functions

#### 2.1 Create Printer Slug Utilities
Create `src/lib/printerSlugUtils.ts`:

```typescript
// Generate SEO-friendly slug from brand + model
export function generatePrinterSlug(
  brand: string | null | undefined,
  modelName: string | null | undefined
): string;

// Check if string is UUID
export function isUuid(str: string): boolean;

// Get SEO URL for a printer
export function getPrinterSeoUrl(printer: { 
  printer_id: string; 
  id: string; 
}): string;
```

#### 2.2 Create `usePrinterBySlug` Hook
Create `src/hooks/usePrinterBySlug.ts` following the filament pattern:
- Fetch by UUID or slug
- Auto-rewrite URL from UUID to slug using `history.replaceState()`
- Multi-stage fallback search if exact match fails
- Auto-heal missing slugs by updating database

---

### Phase 3: Frontend - Update Components

#### 3.1 Update Printer Detail Page
Modify `src/pages/PrinterDetail.tsx`:
- Use new `usePrinterBySlug` hook
- Add URL rewriting from UUID to slug (like filaments)
- Update SEO metadata to use canonical slug URL

#### 3.2 Update All Printer Links (10+ files)
Change all printer links from `printer.id` to `printer.printer_id`:

| File | Current | New |
|------|---------|-----|
| `MediumStandardPrinterCard.tsx` | `printer.id` | `printer.printer_id` |
| `LargeFeaturedPrinterCard.tsx` | `printer.id` | `printer.printer_id` |
| `SmallDeemphasizedPrinterCard.tsx` | `printer.id` | `printer.printer_id` |
| `SimilarPrinterCard.tsx` | `printer.id` | `printer.printer_id` |
| `PrinterQuizResults.tsx` | `printer.id` | `printer.printer_id` |
| `SavedPrinterCard.tsx` | `printerId` (UUID) | (needs lookup) |
| `PrinterCompare.tsx` | `printer.id` | `printer.printer_id` |
| `AMSDetail.tsx` | `printer.id` | `printer.printer_id` |
| `HotendDetail.tsx` | `printer.id` | `printer.printer_id` |
| `BuildPlateDetail.tsx` | `printer.id` | `printer.printer_id` |

---

### Phase 4: Backward Compatibility

#### 4.1 UUID Redirect Logic
The detail page will:
1. Accept both UUID and slug in the URL
2. If UUID is detected, fetch printer and silently rewrite URL to slug
3. No HTTP redirect (uses `history.replaceState()`) to avoid redirect loops

#### 4.2 Fallback Search
If exact slug match fails:
1. Try fuzzy match on `printer_id`
2. Try brand + model component search
3. Display "Not Found" with suggestions if no match

---

## File Changes Summary

### New Files
1. `src/lib/printerSlugUtils.ts` - Slug generation utilities
2. `src/hooks/usePrinterBySlug.ts` - Hook for fetching by slug

### Modified Files
1. `src/pages/PrinterDetail.tsx` - Use new hook, add URL rewriting
2. `src/components/printers/MediumStandardPrinterCard.tsx` - Use slug links
3. `src/components/printers/LargeFeaturedPrinterCard.tsx` - Use slug links
4. `src/components/printers/SmallDeemphasizedPrinterCard.tsx` - Use slug links
5. `src/components/printer/SimilarPrinterCard.tsx` - Use slug links
6. `src/components/printers/PrinterQuizResults.tsx` - Use slug links
7. `src/components/account/SavedPrinterCard.tsx` - Use slug links
8. `src/pages/PrinterCompare.tsx` - Use slug links
9. `src/pages/AMSDetail.tsx` - Use slug links
10. `src/pages/HotendDetail.tsx` - Use slug links
11. `src/pages/BuildPlateDetail.tsx` - Use slug links

### Database Migration
1. Normalize `printer_id` values (underscores → hyphens)
2. Add unique constraint on `printer_id`
3. Create slug generation function

---

## Edge Cases & Considerations

### Duplicate Slugs
When brand + model creates duplicates:
1. First: `bambu-lab-p1s`
2. With variant: `bambu-lab-p1s-combo` (append variant name)
3. Numeric fallback: `bambu-lab-p1s-2` (if still duplicate)

### Special Characters
Handle model names with special characters:
- `MINI+` → `mini-plus`
- `Ender-3 V2 Neo` → `ender-3-v2-neo`
- Trademark symbols stripped

### Migration Safety
- Run slug normalization in a transaction
- Validate no duplicates before committing
- Log any conflicts for manual review

---

## Testing Checklist

- [ ] Old UUID URLs redirect to new slug URLs
- [ ] All listing pages link to slug URLs
- [ ] Slug URLs load correctly
- [ ] SEO canonical URLs use slugs
- [ ] No duplicate slugs in database
- [ ] Compare feature works with new URLs
- [ ] Saved printers/wishlists work correctly
- [ ] Search engines see consistent URLs
