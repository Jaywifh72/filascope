

# Add Filament Wizard - Regional URLs Integration

## Overview
This implementation updates the Add Filament Wizard from 5 steps to 6 steps, adding a dedicated Regional URLs step and updating the Pricing step to support regional MSRP overrides. The wizard will now properly set up multi-region product data from the start.

## Pre-Check Results
- Edit modal has Regional URLs tab: **Verified**
- Can add/edit regional URLs: **Verified** (RegionalUrlEditor.tsx functional)
- Regional prices tab works: **Verified** (RegionalPriceEditor.tsx functional)

---

## Implementation Steps

### Step 1: Update Wizard Schema and Configuration

**File:** `src/components/admin/inventory/AddFilamentWizard.tsx`

**Changes:**
- Add new form fields for regional data:
  - `detected_region`: Auto-detected region from primary URL
  - `regional_urls`: Array of regional URL data
  - `regional_msrps`: Array of regional MSRP overrides
  - `sync_after_create`: Boolean to trigger immediate sync
- Update `STEP_LABELS` from 5 to 6 steps:
  ```typescript
  const STEP_LABELS = ['Source', 'Basic', 'Regional URLs', 'Pricing', 'Details', 'Review'];
  const TOTAL_STEPS = 6;
  ```
- Update `STEP_FIELDS` mapping for validation

**Form Schema Additions:**
```typescript
// Add to wizardSchema
detected_region: z.string().optional(),
regional_urls: z.array(z.object({
  region_code: z.string(),
  store_url: z.string().url().optional(),
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

---

### Step 2: Update FilamentWizardStep1 (Source Information)

**File:** `src/components/admin/inventory/wizard/FilamentWizardStep1.tsx`

**Enhancements:**
1. Add region auto-detection display when URL is entered
2. Show detected region badge: "This appears to be a US store URL"
3. Store detected region in form for use in Step 3

**New UI Elements:**
```text
Product URL: [https://store.creality.com/us/products/...]

┌────────────────────────────────────────────────────┐
│ 🇺🇸 Detected: United States store URL             │
│ This will be set as the primary regional URL      │
└────────────────────────────────────────────────────┘
```

**Logic:**
- Use existing `detectBrandFromUrl` for brand
- Add `detectRegionFromUrl` function (already exists in RegionalUrlEditor)
- Auto-set the primary URL's region in form state

---

### Step 3: Create FilamentWizardStep3 (Regional URLs - NEW)

**File:** `src/components/admin/inventory/wizard/FilamentWizardStep3Regional.tsx`

A new wizard step dedicated to configuring regional store URLs.

**Layout:**
```text
┌─ Step 3: Regional Store URLs ─────────────────────────────────────┐
│                                                                    │
│ Configure where this filament can be purchased in different        │
│ regions. This helps users find the best local store.               │
│                                                                    │
│ Primary URL (from Step 1):                                        │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 🇺🇸 https://store.creality.com/us/products/hyper-abs         │ │
│ │    Creality US (Primary)                                      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ────────────────────────────────────────────────────────────────── │
│                                                                    │
│ Add URLs for other regions:                     [+ Add URL]       │
│                                                                    │
│ 🇨🇦 Canada                                                        │
│ [https://store.creality.com/ca/products/...] [Creality CA] [🗑]   │
│                                                                    │
│ 🇪🇺 Europe                                                         │
│ [https://store.creality.com/eu/products/...] [Creality EU] [🗑]   │
│                                                                    │
│ Quick Add: [CA] [EU] [UK] [AU]                                    │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ 💡 Auto-Generate URLs                                          ││
│ │ Many brands use the same product slug across regions.         ││
│ │ [🔄 Generate URLs from Primary URL]                            ││
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
1. Display primary URL from Step 1 (non-editable, shown as reference)
2. Add regional URLs with region dropdown
3. Quick-add buttons for common regions
4. Auto-generate URLs button with pattern detection
5. Reuse URL auto-detection and store name extraction logic

**Auto-Generate URL Logic:**
```typescript
function autoGenerateRegionalUrls(primaryUrl: string, sourceRegion: RegionCode): SuggestedUrl[] {
  const suggestions: SuggestedUrl[] = [];
  
  // Pattern 1: /us/ → /ca/, /eu/, etc.
  if (/\/us\//i.test(primaryUrl)) {
    suggestions.push({ region: 'CA', url: primaryUrl.replace(/\/us\//i, '/ca/') });
    suggestions.push({ region: 'EU', url: primaryUrl.replace(/\/us\//i, '/eu/') });
    suggestions.push({ region: 'UK', url: primaryUrl.replace(/\/us\//i, '/uk/') });
    suggestions.push({ region: 'AU', url: primaryUrl.replace(/\/us\//i, '/au/') });
  }
  
  // Pattern 2: subdomain: us.store.com → ca.store.com
  if (/^https?:\/\/us\./i.test(primaryUrl)) {
    suggestions.push({ region: 'CA', url: primaryUrl.replace(/^(https?:\/\/)us\./i, '$1ca.') });
    // etc.
  }
  
  return suggestions;
}
```

---

### Step 4: Update Pricing Step (Now Step 4)

**File:** `src/components/admin/inventory/wizard/FilamentWizardStep3.tsx` 
→ Renamed/updated to `FilamentWizardStep4Pricing.tsx`

**Enhancements:**
1. Show base MSRP input (USD) as before
2. Add regional MSRP override section for configured regions
3. Show "Sync after create" checkbox

**Updated Layout:**
```text
┌─ Step 4: Pricing ─────────────────────────────────────────────────┐
│                                                                    │
│ Base MSRP (USD): [$29.99                              ]           │
│                                                                    │
│ Current Price:   [$24.99                              ] (optional)│
│                                                                    │
│ Compare At:      [$34.99                              ] (optional)│
│                                                                    │
│ ────────────────────────────────────────────────────────────────── │
│                                                                    │
│ Regional MSRP Overrides:                                          │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ Region       │ Currency │ Regional MSRP                       ││
│ │──────────────│──────────│─────────────────────────────────────││
│ │ 🇺🇸 US       │ USD      │ Uses base MSRP                      ││
│ │ 🇨🇦 CA       │ CAD      │ [C$ 39.99      ]                    ││
│ │ 🇪🇺 EU       │ EUR      │ [€ 32.99       ]                    ││
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│ ☐ Sync prices from all configured stores after creation          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Step 5: Rename Existing Steps

**File Renames:**
- `FilamentWizardStep3.tsx` → Keep as is but update import paths
- `FilamentWizardStep4.tsx` → Keep (becomes Step 5 - Details)
- `FilamentWizardStep5.tsx` → Keep (becomes Step 6 - Review)

**AddFilamentWizard.tsx Changes:**
```typescript
// Update step rendering
const renderStepContent = () => {
  switch (currentStep) {
    case 1:
      return <FilamentWizardStep1 form={form} />;
    case 2:
      return <FilamentWizardStep2 form={form} />;
    case 3:
      return <FilamentWizardStep3Regional form={form} />; // NEW
    case 4:
      return <FilamentWizardStep4Pricing form={form} />; // Updated
    case 5:
      return <FilamentWizardStep5Details form={form} />; // Renamed from Step4
    case 6:
      return <FilamentWizardStep6Review form={form} onGoToStep={handleGoToStep} />; // Renamed from Step5
    default:
      return null;
  }
};
```

---

### Step 6: Update Review Step (Now Step 6)

**File:** `src/components/admin/inventory/wizard/FilamentWizardStep5.tsx`
→ Renamed to `FilamentWizardStep6Review.tsx`

**Enhancements:**
1. Add Regional URLs section showing configured URLs
2. Add Regional Coverage badges
3. Show pricing per region
4. Update step references (Edit buttons now point to correct steps)

**New Section in Review:**
```text
┌─ Regional URLs ────────────────────────────────────── [Edit] ─────┐
│                                                                    │
│ Coverage: 🇺🇸 ✓  🇨🇦 ✓  🇪🇺 ✓  🇬🇧 ✗  🇦🇺 ✗                        │
│                                                                    │
│ 🇺🇸 US: store.creality.com/us/... (Primary)                       │
│ 🇨🇦 CA: store.creality.com/ca/...                                  │
│ 🇪🇺 EU: store.creality.com/eu/...                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌─ Pricing ─────────────────────────────────────────── [Edit] ─────┐
│                                                                    │
│ Base MSRP: $29.99 USD                                             │
│                                                                    │
│ Regional:                                                          │
│   🇺🇸 US: $29.99 USD                                               │
│   🇨🇦 CA: C$39.99 CAD                                              │
│   🇪🇺 EU: €32.99 EUR                                               │
│                                                                    │
│ ☑ Will sync prices after creation                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Step 7: Update handleCreate for Regional Data

**File:** `src/components/admin/inventory/AddFilamentWizard.tsx`

Update the creation flow to:
1. Create the filament record
2. Insert regional URLs into `product_regional_urls`
3. Insert regional MSRP data into `product_regional_prices`
4. Update `has_regional_urls` and `available_regions` on filament
5. Optionally trigger sync if `sync_after_create` is checked

**Updated handleCreate:**
```typescript
const handleCreate = async (addAnother = false) => {
  const isValid = await form.trigger();
  if (!isValid) return;

  const values = form.getValues();
  
  // 1. Create filament
  const insertData = {
    // ... existing fields
    has_regional_urls: values.regional_urls.length > 0,
    available_regions: values.regional_urls.map(u => u.region_code),
    primary_region: values.detected_region || 'US',
  };
  
  createFilament.mutate(insertData, {
    onSuccess: async (result) => {
      // 2. Insert regional URLs
      if (values.regional_urls.length > 0) {
        await saveRegionalUrls.mutateAsync({
          productId: result.id,
          productType: 'filament',
          urls: values.regional_urls.map(u => ({
            product_id: result.id,
            product_type: 'filament',
            region_code: u.region_code,
            store_url: u.store_url,
            store_name: u.store_name,
            currency_code: u.currency_code,
            is_primary: u.is_primary,
            is_verified: u.is_verified,
          })),
        });
      }
      
      // 3. Insert regional prices
      if (values.regional_msrps.length > 0) {
        await saveRegionalPrices.mutateAsync({
          productId: result.id,
          productType: 'filament',
          prices: values.regional_msrps.map(p => ({
            product_id: result.id,
            product_type: 'filament',
            region_code: p.region_code,
            currency_code: p.currency_code,
            msrp: p.msrp,
            current_price: null,
          })),
        });
      }
      
      // 4. Optionally trigger sync
      if (values.sync_after_create) {
        // Queue sync job (future implementation)
        toast.info('Price sync queued for configured regions');
      }
      
      // Continue with existing flow...
    },
  });
};
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `AddFilamentWizard.tsx` | Update | Add regional form fields, update step count, update creation logic |
| `wizard/FilamentWizardStep1.tsx` | Update | Add region detection display |
| `wizard/FilamentWizardStep3Regional.tsx` | **Create** | New regional URLs step |
| `wizard/FilamentWizardStep4Pricing.tsx` | **Create** | Enhanced pricing step with regional MSRP |
| `wizard/FilamentWizardStep5Details.tsx` | Rename | Was Step4, now Step5 |
| `wizard/FilamentWizardStep6Review.tsx` | **Create** | Enhanced review with regional data |
| `wizard/autoGenerateUrls.ts` | **Create** | URL generation utility |

---

## Technical Details

### URL Auto-Generation Patterns

The system will detect common URL patterns and suggest regional variants:

| Pattern Type | Example Primary | Suggested CA | Suggested EU |
|--------------|-----------------|--------------|--------------|
| Path segment | `/us/products/x` | `/ca/products/x` | `/eu/products/x` |
| Subdomain | `us.store.com/x` | `ca.store.com/x` | `eu.store.com/x` |
| TLD variant | `store.com/x` | `store.ca/x` | `store.de/x` |

### Form State Shape

```typescript
interface WizardFormValues {
  // Step 1: Source
  product_url: string;
  vendor: string;
  source_type: 'manufacturer' | 'retailer' | 'amazon' | 'other';
  detected_region: RegionCode;          // NEW

  // Step 2: Basic Info
  product_title: string;
  material: string;
  diameter: '1.75' | '2.85';
  net_weight_g: number;
  color_name: string;
  color_hex: string;

  // Step 3: Regional URLs (NEW)
  regional_urls: Array<{
    region_code: RegionCode;
    store_url: string;
    store_name: string;
    currency_code: CurrencyCode;
    is_primary: boolean;
    is_verified: boolean;
  }>;

  // Step 4: Pricing (enhanced)
  msrp: number;
  variant_price?: number;
  variant_compare_at_price?: number;
  regional_msrps: Array<{              // NEW
    region_code: RegionCode;
    currency_code: CurrencyCode;
    msrp: number | null;
  }>;
  sync_after_create: boolean;           // NEW

  // Step 5: Details
  featured_image?: string;
  nozzle_temp_min_c?: number;
  nozzle_temp_max_c?: number;
  bed_temp_min_c?: number;
  bed_temp_max_c?: number;
  admin_notes?: string;
}
```

### Reusing Existing Components

The implementation will reuse:
- `REGION_URL_PATTERNS` from `RegionalUrlEditor.tsx` for region detection
- `extractStoreNameFromUrl` from `RegionalUrlEditor.tsx` for store name extraction
- `REGIONS` config from `src/config/regions.ts`
- `RegionalCoverageBadges` from the admin inventory components

---

## Verification Checklist

After implementation:
- [ ] Wizard shows 6 steps with labels: Source, Basic, Regional URLs, Pricing, Details, Review
- [ ] Step 1 displays detected region from URL with flag badge
- [ ] Step 3 shows primary URL from Step 1 as read-only reference
- [ ] Step 3 allows adding regional URLs with dropdown
- [ ] Auto-generate URLs button creates valid suggestions
- [ ] Quick-add buttons (CA, EU, UK, AU) work correctly
- [ ] Step 4 shows base MSRP plus regional MSRP overrides for configured regions
- [ ] "Sync after create" checkbox appears and persists
- [ ] Step 6 (Review) shows all regional URLs with coverage badges
- [ ] After creation, records appear in `product_regional_urls` table
- [ ] After creation, records appear in `product_regional_prices` table
- [ ] Filament record has `has_regional_urls` = true and populated `available_regions`

