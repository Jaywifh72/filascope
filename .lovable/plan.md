

## Restructure "Resources" Dropdown to "Learn" Mega-Menu

### Overview
Transform the existing "Resources" dropdown into a "Learn" mega-menu with three organized sections, wider layout, and new navigation links. This includes creating three placeholder pages for routes that don't yet exist.

---

### Changes Summary

| Category | What Changes |
|----------|-------------|
| **Navbar Label** | "Resources" → "Learn" |
| **Dropdown Width** | ~220px → 400px+ |
| **Structure** | Flat list → 3 categorized sections |
| **Items Removed** | "Specialty Tools", "Material Wizard" |
| **New Routes** | 3 placeholder pages |

---

### Section 1: Navbar Dropdown Restructure

**File:** `src/components/Navbar.tsx`

1. Rename trigger label from "Resources" to "Learn"
2. Update `isResourcesActive` path check to include new routes
3. Replace flat dropdown content with 3-section mega-menu layout:

**Section Layout (stacked with dividers):**
```
┌─────────────────────────────────────────┐
│ 📖 Guides & References                  │
│ ├─ Material Encyclopedia → /compare     │
│ ├─ Print Settings Guide → /guides/print-settings │
│ └─ Troubleshooting → /guides/troubleshooting │
├─────────────────────────────────────────┤
│ 🔧 Tools & Software                     │
│ ├─ Slicer Directory → /reference/slicers│
│ ├─ 3D Modeling Software → /reference/cad│
│ └─ Print Profiles → /resources/profiles │
├─────────────────────────────────────────┤
│ 🌐 Community                            │
│ ├─ Model Repositories → /reference/repos│
│ ├─ Creator Spotlights → /reference/influencers │
│ └─ Accessories & Upgrades → /accessories│
└─────────────────────────────────────────┘
```

**Styling Details:**
- Dropdown width: `min-w-[400px]`
- Section headers: `text-xs font-semibold uppercase tracking-wide text-gray-500`
- Icons: Use Lucide icons (BookOpen, Wrench, Globe) for section headers
- Items: Individual icons + labels with `text-sm font-medium`
- Dividers: `border-t border-border/30 my-2`

4. Update the `resourcesItems` array for tablet/mobile "More" dropdown
5. Update mobile menu "Resources" section label to "Learn"

---

### Section 2: New Placeholder Pages

Create 3 new placeholder pages matching the existing site style:

**1. Print Settings Guide** (`src/pages/GuidePrintSettings.tsx`)
- Route: `/guides/print-settings`
- Content: Hero + "Coming Soon" card explaining future content about print profiles, speed, layer height, etc.

**2. Troubleshooting Guide** (`src/pages/GuideTroubleshooting.tsx`)
- Route: `/guides/troubleshooting`
- Content: Hero + "Coming Soon" card for diagnosing print failures, stringing, warping, etc.
- Note: Links to existing `/diagnose` page for future integration

**3. Print Profiles** (`src/pages/ResourcesProfiles.tsx`)
- Route: `/resources/profiles`
- Content: Hero + "Coming Soon" card for downloadable slicer profiles

All pages will use the established dark theme styling with consistent hero sections.

---

### Section 3: Route Registration

**File:** `src/App.tsx`

Add lazy imports and routes:
```typescript
const GuidePrintSettings = lazy(() => import("./pages/GuidePrintSettings"));
const GuideTroubleshooting = lazy(() => import("./pages/GuideTroubleshooting"));
const ResourcesProfiles = lazy(() => import("./pages/ResourcesProfiles"));

// Routes
<Route path="/guides/print-settings" element={<GuidePrintSettings />} />
<Route path="/guides/troubleshooting" element={<GuideTroubleshooting />} />
<Route path="/resources/profiles" element={<ResourcesProfiles />} />
```

---

### Technical Details

**Icon Mapping for Dropdown Items:**

| Item | Icon |
|------|------|
| Material Encyclopedia | BookOpen |
| Print Settings Guide | Settings or SlidersHorizontal |
| Troubleshooting | AlertCircle or Bug |
| Slicer Directory | Scissors |
| 3D Modeling Software | Box |
| Print Profiles | FileText or Download |
| Model Repositories | FolderGit2 |
| Creator Spotlights | Youtube |
| Accessories & Upgrades | Puzzle |

**Files to Create:**
- `src/pages/GuidePrintSettings.tsx`
- `src/pages/GuideTroubleshooting.tsx`
- `src/pages/ResourcesProfiles.tsx`

**Files to Modify:**
- `src/components/Navbar.tsx` (dropdown restructure, label changes)
- `src/App.tsx` (new route registrations)

---

### Items Explicitly Removed from Dropdown
- "Specialty Tools" (previously at `/reference/specialty`)
- "Material Wizard" (previously at `/wizard`) - will remain accessible via hero section

These pages still exist and are routable, just not linked in the dropdown.

