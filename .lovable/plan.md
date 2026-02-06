

# Plan: Resolve All 404 Errors from Footer and Navigation Links

## Current State Analysis

### Routes That Exist (Working)
| Path | Page | Status |
|------|------|--------|
| `/compare` | Knowledge Base / Material Encyclopedia | ✅ Working |
| `/matrix` | Compatibility Matrix | ✅ Working |
| `/reference/slicers` | Slicer Directory | ✅ Working |
| `/reference/repos` | Model Repositories | ✅ Working |
| `/reference/methodology` | Our Methodology | ✅ Working |
| `/privacy` | Privacy Policy | ✅ Working |
| `/terms` | Terms of Service | ✅ Working |
| `/affiliate-disclosure` | Affiliate Disclosure | ✅ Working |

### Broken Links Identified
| Broken Link | Referenced In | Current Route | Fix |
|-------------|--------------|---------------|-----|
| `/knowledge-base` | `FeatureHelpIcon.tsx` (line 33) | Does not exist | Redirect to `/compare` |
| (none found) | Footer correctly points to existing routes | — | — |

### Footer Links (Already Correct)
After auditing `SiteFooter.tsx`:
- **Explore**: `/`, `/printers`, `/brands`, `/deals`, `/reference/slicers` ✅
- **Resources**: `/compare`, `/matrix`, `/reference/slicers`, `/reference/repos`, `/wizard` ✅  
- **Company**: `/reference/methodology`, mailto, `/privacy`, `/terms`, `/affiliate-disclosure` ✅

### Learn Dropdown Links (Already Correct with Soon Badges)
From `Navbar.tsx` lines 183-210:
- `/compare` → Material Encyclopedia ✅
- `/guides/print-settings` → Print Settings Guide (comingSoon: true) ✅
- `/guides/troubleshooting` → Troubleshooting (comingSoon: true) ✅
- `/reference/slicers` → Slicer Directory ✅
- `/reference/cad` → 3D Modeling Software (comingSoon: true) ✅
- `/resources/profiles` → Print Profiles (comingSoon: true) ✅
- `/reference/repos` → Model Repositories ✅
- `/reference/influencers` → Creator Spotlights (comingSoon: true) ✅
- `/accessories` → Accessories & Upgrades (comingSoon: true) ✅

---

## Key Finding

The footer and Learn dropdown are **already correctly configured**. The original request mentioned seven broken routes, but upon audit:

1. **`/material-encyclopedia`** — Not used; footer links to `/compare` (correct)
2. **`/compatibility-matrix`** — Not used; footer links to `/matrix` (correct)
3. **`/slicer-directory`** — Not used; footer links to `/reference/slicers` (correct)
4. **`/model-repositories`** — Not used; footer links to `/reference/repos` (correct)
5. **`/knowledge-base`** — Used in `FeatureHelpIcon.tsx` → **BROKEN, needs redirect**
6. **`/methodology`** — Not used; footer links to `/reference/methodology` (correct)
7. **`/about`** — Not linked anywhere in footer or nav (no action needed)

---

## Implementation Plan

### Phase 1: Add Missing Redirect (1 file)

**File: `src/App.tsx`**

Add a redirect from `/knowledge-base` to `/compare`:

```typescript
<Route path="/knowledge-base" element={<Navigate to="/compare" replace />} />
```

This single line resolves the only actual 404 reachable from the codebase.

---

### Phase 2: Verify "Coming Soon" Pages Have Routes (Audit)

The Learn dropdown marks these items with `comingSoon: true`:
- `/guides/print-settings` → Route exists → `GuidePrintSettings.tsx` ✅
- `/guides/troubleshooting` → Route exists → `GuideTroubleshooting.tsx` ✅
- `/reference/cad` → Route exists → `ReferenceCAD.tsx` ✅
- `/resources/profiles` → Route exists → `ResourcesProfiles.tsx` ✅
- `/reference/influencers` → Route exists → `ReferenceInfluencers.tsx` ✅
- `/accessories` → Route exists → `Accessories.tsx` ✅

All "Soon" items have valid routes and pages.

---

### Phase 3: Optional Enhancement - Create About Page

If an `/about` page is desired in the future, create a static page similar to `/privacy` using `LegalPageLayout`:

**File: `src/pages/About.tsx`** (new file)

Content would include:
- Mission statement for FilaScope
- Team/founder information
- History of the project
- Links to methodology and contact

**File: `src/App.tsx`** (add route)

```typescript
const About = lazy(() => import("./pages/About"));
<Route path="/about" element={<About />} />
```

**Note**: This is optional since `/about` is not currently linked anywhere.

---

## Summary of Changes

| File | Change | Priority |
|------|--------|----------|
| `src/App.tsx` | Add `/knowledge-base` → `/compare` redirect | Required |
| `src/pages/About.tsx` | Create About page (optional) | Optional |

---

## Testing Checklist

After implementation:
- [ ] Navigate to `/knowledge-base` → Redirects to `/compare`
- [ ] Click all footer links → No 404s
- [ ] Click all Learn dropdown items → No 404s (Soon items show placeholder pages)
- [ ] Help tooltips with "Material reference" link → Navigate to `/compare`

