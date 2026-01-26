

# Admin Inventory Management - Part 5: Add Filament Wizard

## Pre-Check Verification

Part 4 has been successfully implemented:
- **InlineEditableCell**: Fully functional with double-click editing, Enter/Escape keys, validation
- **EditProductModal**: Complete form with react-hook-form + zod validation, unsaved changes protection
- **useProductMutations**: Optimistic updates with proper cache invalidation

## Overview

Create a 5-step wizard modal for adding new filaments to the inventory. The wizard guides admins through entering all required information with validation at each step, smart defaults, and URL-based auto-detection of brand/vendor.

## Architecture

```text
AddFilamentWizard.tsx (Main modal with step state)
├── WizardStepIndicator.tsx (Progress bar)
├── FilamentWizardStep1.tsx (Source Information)
├── FilamentWizardStep2.tsx (Basic Information)
├── FilamentWizardStep3.tsx (Pricing)
├── FilamentWizardStep4.tsx (Details)
└── FilamentWizardStep5.tsx (Review & Create)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/inventory/AddFilamentWizard.tsx` | Main wizard modal with step navigation and state management |
| `src/components/admin/inventory/wizard/WizardStepIndicator.tsx` | Step progress indicator component |
| `src/components/admin/inventory/wizard/FilamentWizardStep1.tsx` | Source URL and brand selection |
| `src/components/admin/inventory/wizard/FilamentWizardStep2.tsx` | Basic info (name, material, diameter, weight, color) |
| `src/components/admin/inventory/wizard/FilamentWizardStep3.tsx` | Pricing (MSRP, current price, compare at) |
| `src/components/admin/inventory/wizard/FilamentWizardStep4.tsx` | Additional details (description, image, temperatures, notes) |
| `src/components/admin/inventory/wizard/FilamentWizardStep5.tsx` | Review summary and create buttons |
| `src/hooks/useCreateFilament.ts` | Mutation hook for creating new filament |
| `src/lib/brandAutoDetection.ts` | URL-to-brand detection logic |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/InventoryManagement.tsx` | Add wizard open state, pass to GlobalActionsBar |
| `src/components/admin/inventory/GlobalActionsBar.tsx` | Remove placeholder, trigger actual wizard |

---

## Component Specifications

### 1. AddFilamentWizard.tsx

Main wizard container with:
- 5-step navigation (currentStep state)
- Form state preserved across steps using single react-hook-form
- Session storage persistence for resume capability
- Unsaved changes protection on close
- Keyboard navigation (Escape to close with confirm)

Props:
```typescript
interface AddFilamentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (filamentId: string) => void;
}
```

Form Schema (Zod):
```typescript
const wizardSchema = z.object({
  // Step 1: Source
  product_url: z.string().url('Invalid URL').min(1, 'Product URL is required'),
  vendor: z.string().min(1, 'Brand/Vendor is required'),
  source_type: z.enum(['manufacturer', 'retailer', 'amazon', 'other']),
  
  // Step 2: Basic Info
  product_title: z.string().min(1, 'Display name is required').max(255),
  material: z.string().optional(),
  diameter: z.enum(['1.75', '2.85']).default('1.75'),
  net_weight_g: z.coerce.number().min(0).default(1000),
  color_name: z.string().max(100).optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  
  // Step 3: Pricing
  msrp: z.coerce.number().min(0, 'MSRP must be positive'),
  variant_price: z.coerce.number().min(0).optional(),
  variant_compare_at_price: z.coerce.number().min(0).optional(),
  
  // Step 4: Details
  featured_image: z.string().url().optional().or(z.literal('')),
  nozzle_temp_min_c: z.coerce.number().min(150).max(500).optional(),
  nozzle_temp_max_c: z.coerce.number().min(150).max(500).optional(),
  bed_temp_min_c: z.coerce.number().min(0).max(150).optional(),
  bed_temp_max_c: z.coerce.number().min(0).max(150).optional(),
  admin_notes: z.string().max(1000).optional(),
});
```

### 2. WizardStepIndicator.tsx

Visual progress component showing:
- 5 numbered circles connected by lines
- Current step highlighted with primary color
- Completed steps show checkmarks
- Step labels below circles

```text
  (1)───(2)───(3)───(4)───(5)
Source Basic Pricing Details Review
```

### 3. FilamentWizardStep1.tsx (Source Information)

Fields:
- **Product URL** (required): Text input with URL validation
- **Import from URL** button: Shows loading state, triggers URL parsing
- **Brand/Vendor** dropdown: Auto-populated from `automated_brands` table, auto-detected from URL
- **Source Type** radio: Manufacturer | Retailer | Amazon | Other

Auto-detection logic (in brandAutoDetection.ts):
```typescript
const URL_BRAND_PATTERNS = [
  { pattern: /store\.creality\.com/i, brand: 'Creality', slug: 'creality' },
  { pattern: /bambulab\.com/i, brand: 'Bambu Lab', slug: 'bambu-lab' },
  { pattern: /us\.polymaker\.com|polymaker\.com/i, brand: 'Polymaker', slug: 'polymaker' },
  { pattern: /store\.anycubic\.com/i, brand: 'Anycubic', slug: 'anycubic' },
  { pattern: /elegoo\.com/i, brand: 'Elegoo', slug: 'elegoo' },
  { pattern: /esun3d\.com/i, brand: 'eSun', slug: 'esun' },
  { pattern: /prusa3d\.com/i, brand: 'Prusament', slug: 'prusament' },
  { pattern: /colorfabb\.com/i, brand: 'ColorFabb', slug: 'colorfabb' },
  { pattern: /ninjatek\.com/i, brand: 'NinjaTek', slug: 'ninjatek' },
  { pattern: /sunlu\.com/i, brand: 'Sunlu', slug: 'sunlu' },
  { pattern: /amazon\.(com|co\.uk|de|ca|au)/i, brand: null, sourceType: 'amazon' },
];
```

### 4. FilamentWizardStep2.tsx (Basic Information)

Fields:
- **Display Name** (required): Pre-filled if URL import worked
- **Material** dropdown: PLA, PLA+, ABS, PETG, TPU, ASA, Nylon, PC, PVA, HIPS, CF-PLA, CF-PETG, CF-Nylon, GF-PLA, GF-PETG, Silk PLA, Matte PLA, Wood, Metal, Other
- **Diameter** radio: 1.75mm (default) | 2.85mm
- **Weight** number input: Default 1000g
- **Color Name** text: e.g., "Matte Black"
- **Color Hex** picker: Optional color input with preview swatch

### 5. FilamentWizardStep3.tsx (Pricing)

Fields:
- **MSRP** (required): Number with $ prefix, validation for positive
- **Current Price** (optional): Number with $ prefix, for manual override
- **Compare At Price** (optional): Original/strikethrough price

Visual feedback:
- Shows price difference percentage if both MSRP and current price entered
- Currency note: "All prices in USD"

### 6. FilamentWizardStep4.tsx (Details)

Fields:
- **Image URL**: URL input with live preview thumbnail
- **Print Temperature Range**: Two number inputs (min/max) with "°C" suffix
- **Bed Temperature Range**: Two number inputs (min/max) with "°C" suffix
- **Admin Notes**: Textarea (max 1000 chars)

Temperature validation:
- Nozzle temp: 150-500°C, min must be less than max
- Bed temp: 0-150°C, min must be less than max

### 7. FilamentWizardStep5.tsx (Review & Create)

Summary display:
- Card sections for each step's data
- "Edit" buttons to jump back to specific steps
- Image preview if provided
- Validation status indicators

Actions:
- **Create Filament** button: Creates and closes wizard
- **Create & Add Another** button: Creates and resets wizard for next entry

---

## Hook: useCreateFilament

```typescript
// src/hooks/useCreateFilament.ts
export function useCreateFilament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FilamentInsertData) => {
      // Map form data to database columns
      const insertData = {
        product_title: data.product_title,
        display_name: data.product_title, // Same as title for new products
        product_url: data.product_url,
        vendor: data.vendor,
        material: data.material,
        diameter_nominal_mm: parseFloat(data.diameter),
        net_weight_g: data.net_weight_g,
        color_name: data.color_name,
        color_hex: data.color_hex || null,
        msrp: data.msrp,
        variant_price: data.variant_price || null,
        variant_compare_at_price: data.variant_compare_at_price || null,
        featured_image: data.featured_image || null,
        nozzle_temp_min_c: data.nozzle_temp_min_c || null,
        nozzle_temp_max_c: data.nozzle_temp_max_c || null,
        bed_temp_min_c: data.bed_temp_min_c || null,
        bed_temp_max_c: data.bed_temp_max_c || null,
        admin_notes: data.admin_notes || null,
        sync_enabled: true,
        auto_created: false,
      };
      
      const { data: result, error } = await supabase
        .from('filaments')
        .insert(insertData)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success('Filament created successfully', {
        description: result.product_title,
      });
    },
    onError: (err) => {
      toast.error('Failed to create filament', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    },
  });
}
```

---

## Session Storage Persistence

The wizard will persist form state to sessionStorage to allow resuming:

```typescript
const WIZARD_STORAGE_KEY = 'add-filament-wizard-progress';
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// On mount, check for saved progress
useEffect(() => {
  const saved = sessionStorage.getItem(WIZARD_STORAGE_KEY);
  if (saved) {
    const { data, step, timestamp } = JSON.parse(saved);
    if (Date.now() - timestamp < STORAGE_MAX_AGE_MS) {
      setShowRestorePrompt(true);
      setSavedData({ data, step });
    }
  }
}, []);

// On form change, save progress
useEffect(() => {
  if (form.formState.isDirty) {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({
      data: form.getValues(),
      step: currentStep,
      timestamp: Date.now(),
    }));
  }
}, [form.watch(), currentStep]);
```

---

## UI/UX Details

### Modal Layout
```text
+--------------------------------------------------+
| Add New Filament                            [X]  |
+--------------------------------------------------+
| Step Indicator: (1)─(2)─(3)─(4)─(5)              |
|               Source Basic Pricing Details Review |
+--------------------------------------------------+
|                                                  |
| [Step Content Area]                              |
|                                                  |
| - Form fields for current step                   |
| - Validation errors shown inline                 |
| - Image previews where applicable                |
|                                                  |
+--------------------------------------------------+
| [Back]                          [Next / Create]  |
+--------------------------------------------------+
```

### Styling
- Modal width: `max-w-2xl` for comfortable form layout
- Step indicator: Primary color for current/completed, muted for future
- Form sections: Grouped with subtle headers
- Validation errors: Red text below fields
- Success state: Green checkmarks on completed steps

---

## Wiring Up in InventoryManagement

```typescript
// src/pages/admin/InventoryManagement.tsx
const [showAddFilamentWizard, setShowAddFilamentWizard] = useState(false);

// Update handler
const handleAddFilament = () => {
  setShowAddFilamentWizard(true);
};

// In JSX, after GlobalActionsBar
<AddFilamentWizard
  open={showAddFilamentWizard}
  onOpenChange={setShowAddFilamentWizard}
/>
```

---

## Validation Summary

| Step | Required Fields | Validation Rules |
|------|----------------|------------------|
| 1 | product_url, vendor | Valid URL format |
| 2 | product_title | Non-empty, max 255 chars |
| 3 | msrp | Positive number |
| 4 | (none) | Temp ranges: min < max, within limits |
| 5 | (none) | Review only |

---

## Technical Notes

1. **Database Schema**: Only `product_title` is required for insert; all other fields are optional
2. **Brand Auto-Detection**: Uses URL pattern matching against known store domains
3. **Form Library**: react-hook-form with zod resolver for consistency with EditProductModal
4. **State Persistence**: sessionStorage for wizard resume, cleared on successful create
5. **Query Invalidation**: Invalidates both admin and public filament queries on success

---

## Verification Checklist

After implementation:
- [ ] "Add Filament" button opens wizard modal
- [ ] Step indicator shows all 5 steps with current step highlighted
- [ ] Back/Next navigation works, preserving form data
- [ ] Step 1: URL input validates, brand auto-detected from URL
- [ ] Step 2: Material dropdown has all options, diameter defaults to 1.75mm
- [ ] Step 3: MSRP required, shows error if empty or negative
- [ ] Step 4: Image URL shows preview, temperature validation works
- [ ] Step 5: Summary displays all entered data, Edit buttons navigate to steps
- [ ] Create button inserts into database and closes wizard
- [ ] Create & Add Another resets form for next entry
- [ ] New filament appears in Filaments tab after creation
- [ ] Closing wizard with unsaved changes shows confirmation dialog
- [ ] Session persistence: closing and reopening offers to restore progress

