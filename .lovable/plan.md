

## Rename Admin to "OldAdmin" and Create New "Admin" with Feature Switches

### Overview
The existing admin panel at `/admin/*` will be moved to `/old-admin/*`, and a new `/admin` section will be created with a "Feature Switches" page. The first switch controls whether Light Mode is available to all users or only admins.

### How It Works

1. **Routes**: `/admin` will point to the new Admin panel. All old admin routes move to `/old-admin/*`.
2. **Feature Switch storage**: Uses the existing `site_settings` table with a new key `light_mode_public` (`{enabled: true/false}`).
3. **Theme gating**: The theme selector in Settings will hide the "Light" and "System" options when `light_mode_public` is off and the user is not an admin.

### Technical Details

#### 1. Database: Insert feature flag row
Insert a new row into `site_settings` for the light mode toggle:
```sql
INSERT INTO site_settings (key, value, description)
VALUES ('light_mode_public', '{"enabled": true}', 'Whether light mode is available to non-admin users')
ON CONFLICT (key) DO NOTHING;
```

#### 2. New hook: `src/hooks/useFeatureSwitch.ts`
A reusable hook following the same pattern as `useMaintenanceMode`:
- Fetches `site_settings` row by key
- Subscribes to realtime changes
- Returns `{ enabled, loading, setEnabled }`

#### 3. New page: `src/pages/NewAdminPanel.tsx`
A new admin page at `/admin` with:
- Admin auth gating (same pattern as existing admin pages)
- A "Feature Switches" card
- A "Light mode option" toggle using the `Switch` component
- Description text explaining the toggle behavior
- Link to "OldAdmin" panel at `/old-admin/dashboard`

#### 4. Route changes in `src/App.tsx`
- Change `/admin` redirect to point to the new `NewAdminPanel`
- Move all existing `/admin/*` routes to `/old-admin/*`
- Add `/old-admin` redirect to `/old-admin/dashboard`

#### 5. Sidebar update: `src/components/admin/AdminSidebar.tsx`
- Update all `href` values from `/admin/...` to `/old-admin/...`
- Rename header from "Admin" to "OldAdmin"

#### 6. AdminLayout update: `src/components/admin/AdminLayout.tsx`
- No structural changes needed; it wraps children generically

#### 7. Theme gating: `src/components/settings/SettingsPreferencesSection.tsx`
- Import `useFeatureSwitch` and `useAuth`
- When `light_mode_public` is disabled and user is not admin:
  - Hide "Light" and "System" options from the theme selector
  - If user's current theme is "light" or "system", auto-switch to "dark"

#### Files to create:
- `src/hooks/useFeatureSwitch.ts`
- `src/pages/NewAdminPanel.tsx`

#### Files to modify:
- `src/App.tsx` (route changes)
- `src/components/admin/AdminSidebar.tsx` (rename + re-path)
- `src/components/settings/SettingsPreferencesSection.tsx` (gate light mode)

