

# My Vault Redesign: Personal Dashboard

## Overview

Transform the `/vault` page from a flat tab-strip layout into a rich, visually engaging personal dashboard with a sidebar navigation, hero stats bar, and a new Dashboard landing tab -- making it feel like a personal command center even when data is empty.

## Current State

- Single heading + 6-column horizontal `TabsList` that truncates at medium widths
- Each empty tab shows a single line of text with no onboarding guidance
- No user identity display, no stats summary, no quick actions
- The entire page is a single 670-line monolithic component (`Vault.tsx`)

## Architecture

The redesign splits the monolith into focused components:

```text
src/pages/Vault.tsx                        (orchestrator, ~150 lines)
src/components/vault/VaultHeroBar.tsx       (avatar + stats strip)
src/components/vault/VaultSidebar.tsx       (desktop sidebar nav)
src/components/vault/VaultMobileNav.tsx     (mobile horizontal scroll tabs)
src/components/vault/VaultDashboard.tsx     (new default landing tab)
src/components/vault/VaultWishlistTab.tsx   (extracted from current Vault.tsx)
src/components/vault/VaultPurchasedTab.tsx  (extracted)
src/components/vault/VaultProjectsTab.tsx   (extracted)
src/components/vault/VaultReviewsTab.tsx    (replaces "Comments" -- public reviews)
src/components/vault/VaultNotesTab.tsx      (private notes, split from comments)
src/components/vault/VaultAlertsTab.tsx     (wraps PriceAlertsSection)
src/components/vault/VaultHistoryTab.tsx    (wraps ViewHistorySection)
src/components/vault/VaultEmptyState.tsx    (reusable rich empty state)
src/hooks/useVaultProfile.ts               (fetch profile + aggregate counts)
```

## Detailed Design

### A. Hero/Stats Bar (`VaultHeroBar`)

- Fetches profile data from `profiles` table (display_name, avatar_url, created_at)
- Displays: Avatar (with initials fallback) | display name | "Member since [month year]"
- Quick stats row rendered as a horizontal set of stat chips:
  - Wishlist count (from `useWishlist`)
  - Purchased count (from purchases query)
  - Projects count (from projects query)
  - Reviews count (from `filament_reviews` query)
  - Alerts count (from `useDatabasePriceAlerts`)
- Each stat is clickable and navigates to its corresponding section
- "Edit Profile" link navigates to `/settings`
- On mobile, the avatar shrinks and stats wrap into a 2-row grid

### B. Sidebar Navigation (`VaultSidebar` + `VaultMobileNav`)

**Desktop (>=1024px):** A vertical sidebar on the left using simple styled nav buttons (not the full Shadcn Sidebar component, to avoid the fixed-position complexity and conflicts with the main site layout). The sidebar will be a static `aside` element within a flex layout.

Each nav item includes:
| Icon | Label | Count Badge |
|------|-------|------------|
| LayoutDashboard | Dashboard | -- |
| Heart | Wishlist | N |
| ShoppingBag | Purchased | N |
| FolderOpen | Projects | N |
| Star | My Reviews | N |
| FileText | Private Notes | N |
| Bell | Price Alerts | N |
| History | History | N |
| Settings | Settings | (link to /settings) |

Active item highlighted with primary accent border-left and background tint.

**Tablet (768-1024px):** Same sidebar but collapsible via a toggle button. Defaults to collapsed (icon-only mode, 56px wide).

**Mobile (<768px):** Horizontal scrollable tab strip (`overflow-x-auto`) at the top of the content area, replacing the current `grid-cols-6` that causes truncation. Each tab shows icon + short label.

### C. Dashboard Tab (`VaultDashboard`) -- New Default Landing

This is the key addition that makes the vault feel alive:

1. **Greeting**: "Welcome back, [display_name]!" (or "Welcome to your Vault!" for new users)

2. **Quick Actions Row**: Four action cards in a responsive grid:
   - "Write a Review" -- links to `/` with a toast prompt
   - "Start a Project" -- opens the create project dialog
   - "Set Price Alert" -- links to `/`
   - "Browse Filaments" -- links to `/`

3. **Recent Activity Feed**: Aggregates the last 5 actions across all sections:
   - Recently viewed items (from browse history)
   - Recent wishlist additions
   - Recent reviews written
   - Recent price alerts set
   - Displayed as a timeline with icons, timestamps, and links

4. **Your Projects Summary**: Latest 3 project cards showing name, filament count, and creation date. "View All" links to Projects tab.

5. **Active Alerts Summary**: Shows triggered or pending alerts (max 3). "View All" links to Alerts tab.

6. **Zero-Data State**: When the user has no data at all, the dashboard shows an onboarding card:
   - "Get started with your Vault"
   - Step-by-step visual guide: "1. Browse filaments  2. Save favorites  3. Set price alerts  4. Track your collection"
   - Each step links to the relevant page

### D. Improved Empty States (`VaultEmptyState`)

A reusable component replacing the current single-line empty text. Each section gets:
- A large muted icon
- A descriptive heading
- A helpful subtitle with guidance
- A primary CTA button

Examples:
- **Wishlist empty**: Heart icon, "Your wishlist is empty", "Save filaments you're interested in to compare later", [Browse Filaments] button
- **Reviews empty**: Star icon, "No reviews yet", "Share your experience to help the community", [Browse Filaments to Review] button
- **Projects empty**: FolderOpen icon, "No projects yet", "Organize filaments by print project", [Create First Project] button

### E. Reviews/Notes Split

The current "Comments" tab merges public and private comments. The redesign splits this into:
- **My Reviews** (`VaultReviewsTab`): Queries `filament_reviews` table for user's public reviews (with rating, review text, helpful count)
- **Private Notes** (`VaultNotesTab`): Queries `filament_comments` where `is_private = true` for the user's private notes

### F. URL-Based Tab State

Replace the current uncontrolled `Tabs defaultValue` with URL search parameter syncing:
- `/vault` defaults to Dashboard
- `/vault?tab=wishlist`, `/vault?tab=reviews`, etc.
- Enables deep linking from other pages (e.g., the existing `/vault?tab=history` link from `RecentlyViewedSection`)

### G. Skeleton Update

Update `VaultSkeleton` to match the new layout (hero bar skeleton + sidebar skeleton + content skeleton).

## Technical Details

### State Management

A new `useVaultProfile` hook consolidates all count data:
```typescript
// Fetches profile + aggregates counts from existing hooks
// Returns: { profile, counts, isLoading }
// counts = { wishlist, purchased, projects, reviews, notes, alerts, history }
```

### Responsive Breakpoints

- `>=1024px` (lg): Full sidebar + content
- `768-1024px` (md): Collapsible sidebar + content
- `<768px`: Mobile horizontal nav + full-width content

### Tab Routing

Uses `useSearchParams` from react-router-dom:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get("tab") || "dashboard";
const setActiveTab = (tab: string) => setSearchParams({ tab });
```

### No Database Changes Required

All data sources already exist:
- `profiles` table has display_name, avatar_url, created_at
- `user_favorites`, `user_purchases`, `projects`, `filament_reviews`, `filament_comments`, `price_alerts`, `user_browse_history` are all present

## Implementation Sequence

1. Create `useVaultProfile` hook (profile data + counts aggregation)
2. Create `VaultEmptyState` reusable component
3. Create `VaultHeroBar` component
4. Create `VaultSidebar` and `VaultMobileNav` components
5. Extract existing tab content into individual tab components (Wishlist, Purchased, Projects, Alerts, History)
6. Create new `VaultReviewsTab` and `VaultNotesTab` (splitting Comments)
7. Create `VaultDashboard` component (greeting, quick actions, activity feed, summaries)
8. Rewrite `Vault.tsx` as the orchestrator with URL-based tab routing
9. Update `VaultSkeleton` to match new layout
10. Test responsive behavior at all three breakpoints

