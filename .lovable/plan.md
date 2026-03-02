
# Replace Palette Builder "Coming Soon" with Functional Scaffold

## Overview
Replace the placeholder content in `src/pages/HueForgePaletteBuilder.tsx` with a real tool layout matching the structural patterns from Layer Preview, TD Database, and Project Planner pages. No new components or routes needed -- just rewriting the single page file.

## Structure (matching Layer Preview pattern exactly)

### Page Shell (unchanged pattern)
- Same gradient wrapper, DocumentHead (improved SEO), BreadcrumbSchema, Breadcrumbs, HueForgeToolsNav

### Hero Section
- Badge: "Palette Builder" with Palette icon (cyan/primary style, not amber "Coming Soon")
- H1: "HueForge Palette Builder" with `bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent`
- Subtitle paragraph below

### Toolbar Row
- Flex row with gap, matching the Layer Preview toolbar (Load Preset | Copy Config | Reset):
  - `Select` component for "Load Preset" (empty, no options)
  - "Copy Config" button (Clipboard icon, ghost variant)
  - "Copy Link" button (Link icon, ghost variant)
  - "Export CSV" button (Download icon, ghost variant)
  - "Reset" button (RotateCcw icon, ghost variant, text-destructive)
- All buttons are non-functional scaffolds (no onClick logic beyond optional toast)

### Main Content -- Two-Column Grid
`grid md:grid-cols-5 gap-8` (same as Layer Preview)

**Left Column (md:col-span-2, space-y-6):**
1. "Add Filaments" card -- contains a Search input (disabled placeholder)
2. "Your Palette" card -- empty state with:
   - Palette icon (muted)
   - "Start Building Your Palette" heading
   - "Search for filaments above or load a preset to get started." subtext
   - Two buttons: "Load a Preset" (outline) and "Browse TD Database" (default, with ArrowRight icon linking to /hueforge-td-database)
3. Summary bar placeholder -- small muted card showing "0 filaments | 0 layers | TD range: --"

**Right Column (md:col-span-3, space-y-6):**
Three placeholder cards, each with:
- Section heading (uppercase tracking-wide text-xs text-muted-foreground, matching Layer Preview section headers)
- Muted placeholder text centered in a min-height area
1. "Palette Analysis" -- "Add filaments to see coverage analysis"
2. "Layer Preview" -- "Add filaments to see layer stacking preview"  
3. "Shopping List" -- "Add filaments to see pricing and purchase links"

### Bottom
- HueForgeToolsCrossLinks (kept from current page)
- SiteFooter (kept from current page)

## SEO Updates
- title: "HueForge Palette Builder -- Build & Analyze Multi-Filament Palettes | FilaScope"
- description: "Build and analyze multi-filament palettes for HueForge lithophane projects. Check TD coverage, find gaps, get filament suggestions, and create your shopping list."

## Files Modified
| File | Change |
|------|--------|
| `src/pages/HueForgePaletteBuilder.tsx` | Full rewrite of page content (same file, new content) |

No new files, no route changes, no database changes needed.
