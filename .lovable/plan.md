

# Add Filament Wizard - Regional URLs Integration (Part 5)

## Pre-Check Results

| Check | Status |
|-------|--------|
| Edit modal has Regional URLs tab | Verified (EditProductModal.tsx lines 358-362) |
| Can add/edit regional URLs | Verified (RegionalUrlEditor.tsx functional) |
| Regional prices tab works | Verified (RegionalPriceEditor.tsx functional) |

All prerequisites from Part 4 are in place.

---

## Overview

Update the Add Filament Wizard from 5 steps to 6 steps by:
1. Enhancing Step 1 to detect and display the region from the primary URL
2. Inserting a new Step 3 for Regional URLs configuration
3. Updating the Pricing step (now Step 4) to include regional MSRP overrides
4. Updating the Review step (now Step 6) to display regional data
5. Modifying the creation logic to insert regional data into the new tables

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `AddFilamentWizard.tsx` | Update | New schema fields, 6 steps, updated creation logic |
| `wizard/FilamentWizardStep1.tsx` | Update | Display detected region badge |
| `wizard/FilamentWizardStep3Regional.tsx` | Create | New Regional URLs step |
| `wizard/FilamentWizardStep4Pricing.tsx` | Create | Enhanced pricing with regional MSRP |
| `wizard/FilamentWizardStep5Details.tsx` | Rename | Was Step4, now Step5 |
| `wizard/FilamentWizardStep6Review.tsx` | Create | Enhanced review with regional data |
| `wizard/autoGenerateUrls.ts` | Create | URL generation utility |

---

## Implementation Details

### Step 1: Update AddFilamentWizard.tsx

**Schema Updates:**
```typescript
// Add new fields to wizardSchema
detected_region: z.string().optional(),
regional_urls: z.array(z.object({
  region_code: z.string(),
  store_url: z.string().optional(),
  store_name: z.string().optional(),
  currency_code: z.string(),
  is_primary: z.boolean(),
  is_verified: z.boolean(),
})).optional().default([]),
regional_msrps: z.array(z.object({
  region_code: z.string(),
  currency_code: z.string(),
  msrp: z.number().nullable(),
})).optional().default([]),
sync_after_create: z.boolean().optional().default(false),
```

**Step Configuration Updates:**
```typescript
const STEP_LABELS = ['Source', 'Basic', 'Regional URLs', 'Pricing', 'Details', 'Review'];
const TOTAL_STEPS = 6;

const STEP_FIELDS: Record<number, (keyof WizardFormValues)[]> = {
  1: ['product_url', 'vendor', 'source_type'],
  2: ['product_title', 'material', 'diameter', 'net_weight_g', 'color_name', 'color_hex'],
  3: ['regional_urls'], // New step
  4: ['msrp', 'variant_price', 'variant_compare_at_price', 'regional_msrps'],
  5: ['featured_image', 'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'admin_notes'],
  6: [],
};
```

**Updated renderStepContent:**
```typescript
const renderStepContent = () => {
  switch (currentStep) {
    case 1: return <FilamentWizardStep1 form={form} />;
    case 2: return <FilamentWizardStep2 form={form} />;
    case 3: return <FilamentWizardStep3Regional form={form} />;
    case 4: return <FilamentWizardStep4Pricing form={form} />;
    case 5: return <FilamentWizardStep5Details form={form} />;
    case 6: return <FilamentWizardStep6Review form={form} onGoToStep={handleGoToStep} />;
    default: return null;
  }
};
```

**Updated handleCreate:**
After creating the filament, insert regional data:
1. Insert filament record with `has_regional_urls` and `available_regions`
2. Insert regional URLs via `useSaveRegionalUrls` mutation
3. Insert regional prices via `useSaveRegionalPrices` mutation
4. Optionally queue sync if `sync_after_create` is checked

---

### Step 2: Update FilamentWizardStep1.tsx

Add region detection display when URL is entered:

```text
Product URL: [https://store.creality.com/us/products/hyper-abs]

[Banner with flag icon]
🇺🇸 Detected: United States store URL
This will be set as the primary regional URL
```

**Logic:**
- Reuse `REGION_URL_PATTERNS` from RegionalUrlEditor for detection
- Auto-set `detected_region` in form when URL changes
- Show info banner with detected region flag and name

---

### Step 3: Create FilamentWizardStep3Regional.tsx (New)

**Layout:**
```text
Step 3: Regional Store URLs

Configure where this filament can be purchased in different regions.

Primary URL (from Step 1):
[Banner] 🇺🇸 https://store.creality.com/us/products/hyper-abs
         Creality US (Primary)

Add URLs for other regions:              [+ Add Region dropdown]

[CA Canada URL input section]
[EU Europe URL input section]

Quick Add: [CA] [EU] [UK] [AU] buttons

[Tip box]
Many brands use the same product slug across regions.
[Auto-Generate URLs button]
```

**Features:**
- Display primary URL from Step 1 as read-only reference
- Reuse components from RegionalUrlEditor (URL input, store name, verified checkbox)
- Quick-add buttons for common regions (CA, EU, UK, AU)
- Auto-generate URLs button that creates variants from primary URL

---

### Step 4: Create autoGenerateUrls.ts Utility

```typescript
interface SuggestedUrl {
  region: RegionCode;
  url: string;
  confidence: 'high' | 'medium' | 'low';
}

export function autoGenerateRegionalUrls(
  primaryUrl: string, 
  sourceRegion: RegionCode
): SuggestedUrl[] {
  const suggestions: SuggestedUrl[] = [];
  
  // Pattern 1: Path segment /us/ -> /ca/, /eu/, etc.
  if (/\/us\//i.test(primaryUrl)) {
    suggestions.push({ 
      region: 'CA', 
      url: primaryUrl.replace(/\/us\//i, '/ca/'), 
      confidence: 'high' 
    });
    suggestions.push({ 
      region: 'EU', 
      url: primaryUrl.replace(/\/us\//i, '/eu/'), 
      confidence: 'high' 
    });
    // ... UK, AU
  }
  
  // Pattern 2: Subdomain us.store.com -> ca.store.com
  if (/^https?:\/\/us\./i.test(primaryUrl)) {
    suggestions.push({ 
      region: 'CA', 
      url: primaryUrl.replace(/^(https?:\/\/)us\./i, '$1ca.'), 
      confidence: 'medium' 
    });
    // ... other regions
  }
  
  return suggestions;
}
```

---

### Step 5: Create FilamentWizardStep4Pricing.tsx (Enhanced)

This replaces the old Step 3 with regional MSRP support:

**Layout:**
```text
Step 4: Pricing

Base MSRP (USD): [$29.99]
Current Price:   [$24.99] (optional)
Compare At:      [$34.99] (optional)

Regional MSRP Overrides:
[Table showing configured regions]
| Region    | Currency | Regional MSRP    |
|-----------|----------|------------------|
| 🇺🇸 US    | USD      | Uses base MSRP   |
| 🇨🇦 CA    | CAD      | [C$ 39.99]       |
| 🇪🇺 EU    | EUR      | [€ 32.99]        |

[Checkbox] Sync prices from all configured stores after creation
```

**Logic:**
- Watch `regional_urls` to know which regions are configured
- Show regional MSRP input for each configured region (except primary)
- Primary region uses the base MSRP

---

### Step 6: Rename FilamentWizardStep4.tsx -> FilamentWizardStep5Details.tsx

- Change import path in AddFilamentWizard
- No content changes needed
- Update import type reference if needed

---

### Step 7: Create FilamentWizardStep6Review.tsx (Enhanced)

Add new sections for regional data:

**Layout:**
```text
Source Information                     [Edit]
...existing content...

Basic Information                      [Edit]
...existing content...

Regional URLs                          [Edit -> Step 3]
Coverage: 🇺🇸 ✓  🇨🇦 ✓  🇪🇺 ✓  🇬🇧 ✗  🇦🇺 ✗

🇺🇸 US: store.creality.com/us/... (Primary)
🇨🇦 CA: store.creality.com/ca/...
🇪🇺 EU: store.creality.com/eu/...

Pricing                                [Edit -> Step 4]
Base MSRP: $29.99 USD

Regional:
  🇺🇸 US: $29.99 USD
  🇨🇦 CA: C$39.99 CAD
  🇪🇺 EU: €32.99 EUR

[Checkbox indicator] Will sync prices after creation

Additional Details                     [Edit -> Step 5]
...existing content...
```

**Uses:**
- Import `RegionalCoverageBadges` component for visual coverage display
- Import `REGIONS` for flag display
- Update step references (Edit buttons point to correct new step numbers)

---

## Data Flow on Creation

```text
User clicks "Create Filament"
         |
         v
[1] Validate all steps
         |
         v
[2] Build filament insert data
    - Include: has_regional_urls, available_regions, primary_region
         |
         v
[3] Insert into 'filaments' table
         |
    onSuccess: result.id
         |
         v
[4] Insert regional URLs (if any)
    - Use useSaveRegionalUrls mutation
    - Skips if regional_urls is empty
         |
         v
[5] Insert regional prices (if any)
    - Use useSaveRegionalPrices mutation
    - Map regional_msrps to price records
         |
         v
[6] Optional: Queue sync jobs
    - If sync_after_create is checked
    - Show toast: "Price sync queued for configured regions"
         |
         v
[7] Success toast + reset/close
```

---

## Reusable Components & Logic

From existing code:
- `REGION_URL_PATTERNS` (RegionalUrlEditor.tsx) for URL detection
- `extractStoreNameFromUrl` (RegionalUrlEditor.tsx) for store name extraction
- `REGIONS` config (regions.ts) for flag/name/currency data
- `RegionalCoverageBadges` component for visual display
- `useSaveRegionalUrls` / `useSaveRegionalPrices` mutations

---

## Technical Considerations

### Form State Shape Extension
```typescript
interface WizardFormValues {
  // Existing fields...
  
  // New Step 1 field
  detected_region: RegionCode | undefined;
  
  // New Step 3 fields
  regional_urls: Array<{
    region_code: RegionCode;
    store_url: string;
    store_name: string;
    currency_code: CurrencyCode;
    is_primary: boolean;
    is_verified: boolean;
  }>;
  
  // New Step 4 fields
  regional_msrps: Array<{
    region_code: RegionCode;
    currency_code: CurrencyCode;
    msrp: number | null;
  }>;
  sync_after_create: boolean;
}
```

### Validation
- Step 3: No required fields (regional URLs are optional)
- Step 4: Base MSRP required, regional MSRPs optional
- Auto-add primary URL from Step 1 to regional_urls when entering Step 3

### Session Storage
Existing sessionStorage mechanism handles new fields automatically since it watches all form values.

---

## Verification Checklist

After implementation:
- [ ] Wizard displays 6 steps with correct labels
- [ ] Step 1 shows detected region badge when URL is entered
- [ ] Step 3 displays primary URL from Step 1 as reference
- [ ] Step 3 allows adding regional URLs with dropdown
- [ ] Quick-add buttons (CA, EU, UK, AU) work
- [ ] Auto-generate URLs button creates valid suggestions
- [ ] Step 4 shows base MSRP plus regional MSRP overrides
- [ ] "Sync after create" checkbox appears
- [ ] Step 6 shows regional URLs with coverage badges
- [ ] Step 6 shows regional pricing summary
- [ ] Edit buttons navigate to correct step numbers
- [ ] After creation, records appear in `product_regional_urls`
- [ ] After creation, records appear in `product_regional_prices`
- [ ] Filament has `has_regional_urls = true` and `available_regions` populated

