

# Admin Panel with Configurable Sidebar Sections

## What this does

Add a sidebar layout to the `/admin` section (similar to the old admin panel), with the ability to:
- Set which sidebar groups are visible by default (your "focused view")
- Toggle to "Show All" when you need access to everything
- Persist your preferences in localStorage so they stick between sessions

## How it will look

The `/admin` panel will get a collapsible sidebar with grouped navigation (Content, Regional, Data Quality, Operations, Analytics, System). A small settings icon at the bottom of the sidebar opens a popover where you can check/uncheck which groups are visible. A toggle at the top of the sidebar lets you flip between "Focused" (your chosen defaults) and "All" view.

## Technical Plan

### 1. Create `AdminNewSidebar.tsx`

A new sidebar component for the `/admin` routes, modeled after the existing `AdminSidebar.tsx` but with:
- Same nav groups, but all links pointing to `/admin/...` routes
- A "View Mode" toggle at the top: Focused vs All
- A settings popover at the bottom to configure which groups are visible by default
- Preferences stored in localStorage under key `admin-sidebar-config`

The sidebar will have:
- Collapsed/expanded state (like old admin)
- Group visibility state: `{ visibleGroups: string[], viewMode: 'focused' | 'all' }`
- When `viewMode = 'focused'`, only groups in `visibleGroups` are shown
- When `viewMode = 'all'`, all groups are shown (with non-default groups slightly dimmed)

### 2. Create `AdminNewLayout.tsx`

A layout wrapper (like `AdminLayout.tsx`) that:
- Wraps the sidebar + content area
- Handles auth gating (redirect non-admins)
- Manages sidebar collapsed state in localStorage

### 3. Update `/admin` routes to use the new layout

Wrap all `/admin` pages (`NewAdminPanel`, `AdminAffiliateHub`, `AdminPricingData`, etc.) in the new `AdminNewLayout`.

### 4. Update `NewAdminPanel.tsx`

Remove the inline auth checks and header since the layout handles that. The page becomes just the dashboard content.

### Files to create
- `src/components/admin/AdminNewSidebar.tsx` -- Sidebar with configurable group visibility
- `src/components/admin/AdminNewLayout.tsx` -- Layout wrapper with sidebar + auth

### Files to modify
- `src/pages/NewAdminPanel.tsx` -- Remove redundant auth/layout, use new layout
- `src/App.tsx` -- Wrap `/admin` routes in the new layout

### Nav groups for the new sidebar

```text
Overview:      Dashboard (/admin)
Content:       Affiliate Hub, Pricing Data
Analytics:     Analytics Dashboard, Search Analytics
Operations:    Link Health, Printer URL Health, Price Sync, Price Audit
System:        OldAdmin Dashboard (link to /old-admin/dashboard)
```

### Section visibility config (stored in localStorage)

```typescript
interface AdminSidebarConfig {
  visibleGroups: string[];  // e.g. ["Overview", "Content", "Analytics"]
  viewMode: 'focused' | 'all';
}

// Default: all groups visible
const DEFAULT_CONFIG: AdminSidebarConfig = {
  visibleGroups: ['Overview', 'Content', 'Analytics', 'Operations', 'System'],
  viewMode: 'all',
};
```

### UI for configuring defaults

At the bottom of the sidebar, a small gear icon opens a popover with:
- Checkboxes for each group (Overview, Content, Analytics, Operations, System)
- A "Reset to all" button
- The current view mode toggle ("Focused" / "All") stays in the sidebar header area

When in "Focused" mode, only checked groups appear. When in "All" mode, everything shows but unchecked groups have a subtle visual treatment (slightly lower opacity) so you can tell which ones are your defaults.

