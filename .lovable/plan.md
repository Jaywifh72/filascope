

## Material Page Question-Format H2s

### Current State
`src/pages/FilamentCategoryPage.tsx` has material-specific SEO content sections for **PLA** (line 923), **PETG** (line 957), and **ABS** (line 991). Each has an H2, a descriptive paragraph, a Quick Reference grid, and a Buying Guide section. **TPU, ASA, and Nylon have no material-specific sections yet.**

### Changes

**File:** `src/pages/FilamentCategoryPage.tsx`

#### 1. Update existing H2 headings and add answer blocks

For PLA, PETG, and ABS, replace the current H2 text with question-format headings and insert a new answer block paragraph immediately after each H2 (before the existing longer paragraph):

| Material | Current H2 | New H2 |
|----------|-----------|--------|
| PLA | "PLA Filament -- The Most Popular 3D Printing Material" | "What Is PLA Filament and Why Is It the Most Popular?" |
| PETG | "PETG Filament -- The Versatile All-Rounder" | "What Is PETG Filament and When Should You Use It?" |
| ABS | "ABS Filament -- The Engineering-Grade Standard" | "What Is ABS Filament and What Is It Best For?" |

Each gets a hardcoded 40-60 word answer block paragraph inserted right after the H2, before the existing detailed paragraph. For PLA, this is the exact text from the prompt. PETG and ABS will follow the same pattern with their specific temperatures and characteristics.

#### 2. Add new material-specific sections for TPU, ASA, and Nylon

Create three new conditional blocks (matching the existing pattern with H2 + answer block + Quick Reference grid + Buying Guide) for:

- **TPU** (`slug === "tpu"`): H2 "What Is TPU Filament and What Can You Print With It?", temps 210-230C / 30-60C, 20-40 mm/s speed, no enclosure required
- **ASA** (`slug === "asa"`): H2 "What Is ASA Filament and Why Use It for Outdoor Prints?", temps 235-260C / 90-110C, 40-80 mm/s, enclosure recommended
- **Nylon** (`slug === "nylon"`): H2 "What Is Nylon Filament and What Are Its Advantages?", temps 240-270C / 70-100C, 30-60 mm/s, enclosure required

Each answer block will be a self-contained 40-60 word paragraph defining the material, its key properties, print settings, and FilaScope database context -- all hardcoded in JSX.

### No other files modified
