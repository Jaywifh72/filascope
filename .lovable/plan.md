
# Plan: Fix Material Base Categorization for Nylon and Other Materials

## Problem Statement
When selecting "Nylon" as a material base filter, only 2 filaments appear despite there being **173+ nylon/PA-based filaments** in the database. This is because the material hierarchy definition in `src/lib/materialHierarchy.ts` has an incomplete list of material strings that should match the nylon-family category.

## Root Cause
The `MATERIAL_CATEGORIES` array defines exact string matches for each material family. The current nylon-family only includes 8 specific strings, but the database contains many more PA/Nylon variants that aren't being matched.

---

## Implementation Plan

### Step 1: Update Nylon/PA Family
**File:** `src/lib/materialHierarchy.ts`

Add all missing nylon/PA variants to the `nylon-family` category:

```text
Current: 8 materials
After:   28+ materials
```

**Materials to add:**
- `PA` (base polyamide - 52 filaments!)
- `PA-CF`, `PA-GF`, `PA-AF`
- `PA6`, `PA6-CF`, `PA6-GF`, `PA6 Neat`, `PA6-66`, `PA6-Wear`, `PA6 CF15`, `PA6 CS20 FR V0`
- `PA11-CF`
- `PA12`, `PA12-CF`, `PA12-GF`, `PA12 CF15`
- `PA612-CF`
- `PAHT-CF` (high-temp PA)
- `Nylon PA6 Low Warp`
- `TPA` (flexible nylon)
- `ESD-PA12`
- `ThermaTech PA`
- `PPA`, `PPA-CF`, `PPA-GF`, `PPA-CF-Core`

### Step 2: Update Flexible/TPU Family
Add missing flexible material variants:

**Materials to add:**
- `TPU-30D`, `TPU-40D`, `TPU-60A`, `TPU-64D`, `TPU-70A`, `TPU-75A`, `TPU-75D`
- `TPU-82A`, `TPU-85A`, `TPU-88A`, `TPU-90A`, `TPU-92A`, `TPU-98A`
- `TPU-FOAM`, `TPU-95A-FOAM`, `TPU-Bio`, `TPU-SEBS`
- `TPE`, `TPE-E`, `TPE-90A`, `TPE-96A`
- `S-Flex 85A`, `S-Flex 90A`, `S-Flex 98A`
- `PEBA-85A`, `PEBA-95A`, `PEBA-FOAM`
- `ESD-TPU`
- `FlexPLA` (already exists)

### Step 3: Update Copolyester Family
Add PCTG variants which are enhanced copolyesters:

**Materials to add:**
- `PCTG`
- `PCTG Premium`
- `PCTG CF10`
- `PCTG GF10`
- `Copolyester`

### Step 4: Update ABS Family
Add missing ABS variants:

**Materials to add:**
- `ABS-ESD`, `ABS-HT`, `ABS-HS`, `ABS-R`
- `ABS-PC`, `ABS-CF-Core`
- `ABS Medical`
- `Easy ABS`, `Smart ABS`
- `ESD-ABS`

### Step 5: Update ASA Family
**Materials to add:**
- `ASA 275`
- `ASA Kevlar`
- `ASA-X CF10`, `ASA-X GF10`
- `LW-ASA`
- `FlameGuard ASA 275`

### Step 6: Update PLA Family
**Materials to add:**
- `PLA Premium`, `PLA Pro`, `PLA Economy`
- `PLA-HS`, `PLA High Speed Pro`, `Premium PLA High Speed`, `PLA Hi-Flow Pro`
- `PLA-HT`, `PLA-HP`
- `PLA Silk`, `PLA SILK`, `PLA Magic SILK`, `PLA SILK Rainbow`
- `PLA-SILK`, `PLA-Starlight`
- `PLA Matte`, `PLA-MATTE`, `PLA Matte Dual-Color`
- `PLA Glow`, `PLA-GLOW`, `PLA Glow in the Dark`
- `PLA Glitter`, `PLA Galaxy`, `PLA Crystal`
- `PLA Marble`, `PLA-MARBLE`
- `PLA Metal`, `PLA-Metal`, `PLA Carbon`
- `PLA Stone Age`, `PLA-Stone`
- `PLA Thermoactive`, `PLA-Tough`
- `Pastello PLA`, `The Filament PLA`, `The Filament PLA HS`, `The Filament PLA CF`
- `AquaPrint PLA`, `Bio-PLA`, `SafeGuard PLA`, `FlameGuard PLA`
- `r-PLA`, `ESD-PLA`, `PLA-Conductive`

### Step 7: Update PETG Family
**Materials to add:**
- `PET-G Premium`, `PET-G Premium High Speed`, `PETG Economy`
- `PETG-HS`, `PETG-GF`, `PETG-TRANSLUCENT`
- `PET-G Glow in the Dark`, `PET-G FR V0`
- `The Filament PETG`, `The Filament PETG CF`
- `ESD-PETG`

### Step 8: Update Polycarbonate Family
**Materials to add:**
- `PC-275`, `PC PTFE`
- `PC-ABS-FR`, `PC-PBT-GF`
- `PC+PBT`
- `FR-PC`, `FR-PC-ABS`

### Step 9: Update High Performance Family
**Materials to add:**
- `PEI-1010`, `PEI-9085`
- `ESD-PEI-1010`
- `PEKK` (base)
- `PES`, `PPSU`

### Step 10: Create New Material Categories

#### New: Bio-Based Materials
```typescript
{
  id: 'bio-materials',
  name: 'Bio-Based',
  description: 'Environmentally friendly and biodegradable materials',
  materials: ['BIO', 'BIO-CF', 'PHA', 'allPHA', 'PCL']
}
```

#### New: Engineering Polymers
```typescript
{
  id: 'engineering-polymers',
  name: 'Engineering Polymers',
  description: 'Specialized engineering materials for demanding applications',
  materials: ['POM', 'PMMA', 'HDPE', 'HTN', 'HTS', 'MTS']
}
```

### Step 11: Update Finder.tsx Normalization
Update the `normalizeVariantName` function to include PA-based variants under the Nylon base:

```typescript
PA: {
  "CF": ["PA-CF", "PA11-CF", "PA12-CF", "PA6-CF", "PA612-CF", "PAHT-CF"],
  "GF": ["PA-GF", "PA6-GF", "PA12-GF"],
  "6": ["PA6", "PA6 Neat", "PA6-66", "PA6-Wear"],
  "12": ["PA12", "PA12 CF15"],
},
Nylon: {
  "PA6 Low Warp": ["Nylon PA6 Low Warp"],
  "NylonG": ["NylonG"],
  "NylonX": ["NylonX"],
}
```

---

## Technical Details

### Files to Modify
1. **`src/lib/materialHierarchy.ts`**
   - Expand `MATERIAL_CATEGORIES` array with all missing materials
   - Add 2 new category definitions (bio-materials, engineering-polymers)
   - Update `MATERIAL_INFO` with new material entries where appropriate

2. **`src/pages/Finder.tsx`**
   - Update `normalizeVariantName` patterns for PA materials
   - Add 'PA' to `baseStandards` array
   - Update variant grouping logic

3. **`src/components/FilamentFilters.tsx`**
   - Add new categories to `SECONDARY_CATEGORIES` if needed

### Expected Outcome
- **Nylon filter**: Will show ~173 filaments instead of 2
- **All materials** will be properly categorized under their correct base family
- New bio-based and engineering polymer categories will organize specialty materials
- Variant normalization will properly group PA/Nylon variants together

### Impact Analysis
- **Low risk**: Changes are additive (adding materials to existing categories)
- **No breaking changes**: Existing material mappings remain unchanged
- **Improved UX**: Users will find all relevant filaments when filtering by material type
