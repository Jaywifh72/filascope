

# Add Enhanced Organization Schema to Homepage

## Current State

The `OrganizationSchema` component already exists and is already rendered on the homepage (`Finder.tsx` line 961). The JSON-LD block is being output correctly.

## What Needs Changing

The default description in `OrganizationSchema.tsx` is slightly less detailed than requested. Update it to include HueForge TD values and specific counts:

**Current**: "The most comprehensive 3D printer filament database. Compare prices, materials, and specifications across brands."

**New**: "The most comprehensive 3D printer filament database. Compare prices, materials, specifications, and HueForge TD values across 1,000+ filaments from 48+ brands."

No other changes are needed -- the component is already properly imported, rendered, and produces the exact JSON-LD structure requested.

## Technical Details

### File: `src/components/seo/OrganizationSchema.tsx`
- Line 19: Update the default `description` parameter to the more detailed version.

