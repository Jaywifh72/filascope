
## Add Email Capture Forms to Existing Placeholder Pages

### Overview
The three placeholder pages (`/guides/print-settings`, `/guides/troubleshooting`, `/resources/profiles`) already exist with proper layouts and "Coming Soon" content. The only missing feature is the **"Subscribe for updates" email capture form** on each page.

---

### Current State
| Page | File | Status |
|------|------|--------|
| `/guides/print-settings` | `src/pages/GuidePrintSettings.tsx` | ✅ Exists - needs email form |
| `/guides/troubleshooting` | `src/pages/GuideTroubleshooting.tsx` | ✅ Exists - needs email form |
| `/resources/profiles` | `src/pages/ResourcesProfiles.tsx` | ✅ Exists - needs email form |

---

### Implementation Plan

#### 1. Create Reusable Email Subscription Component

Create a new component `src/components/SubscribeForUpdates.tsx` that can be shared across all placeholder pages.

**Component Features:**
- Email input with validation
- Submit button with loading state
- Success/error toast notifications
- Dark theme styling matching existing design
- Bell icon to reinforce "notification" concept

**Design:**
- Rounded glassmorphic container (matches existing card style)
- Gradient button (primary cyan-blue)
- Placeholder text: "Enter your email for updates"
- Button text: "Notify Me"

```text
┌─────────────────────────────────────────────────┐
│  🔔 Get Notified When This Goes Live           │
│                                                 │
│  ┌─────────────────────────────┐ ┌───────────┐ │
│  │ Enter your email            │ │ Notify Me │ │
│  └─────────────────────────────┘ └───────────┘ │
│                                                 │
│  We'll only email you when this guide is ready │
└─────────────────────────────────────────────────┘
```

---

#### 2. Update Each Placeholder Page

Add the `<SubscribeForUpdates />` component to each page, positioned after the "Coming Soon" card content but before the action buttons.

**GuidePrintSettings.tsx Changes:**
- Import `SubscribeForUpdates` component
- Add component after the bullet list, before "Explore Other Guides" button
- Pass topic="print settings guide" for personalized messaging

**GuideTroubleshooting.tsx Changes:**
- Import `SubscribeForUpdates` component  
- Add component after the bullet list, before the action buttons
- Pass topic="troubleshooting guide" for personalized messaging

**ResourcesProfiles.tsx Changes:**
- Import `SubscribeForUpdates` component
- Add component after the bullet list, before "Browse Slicers" button
- Pass topic="print profiles" for personalized messaging

---

### Component Props

```typescript
interface SubscribeForUpdatesProps {
  topic?: string;  // Optional: customize the "when X goes live" text
  className?: string;  // Optional: additional styling
}
```

---

### Technical Details

**State Management:**
- `email: string` - controlled input value
- `isLoading: boolean` - submission loading state

**Validation:**
- Basic email format validation
- Display error toast if invalid

**Submission:**
- Simulate API call (same pattern as ComingSoonPage)
- Display success toast on completion
- Clear input after successful submission

**Styling Classes:**
- Container: `bg-gray-900/30 border border-border/30 rounded-xl p-6`
- Input: `bg-transparent border-gray-700` 
- Button: Primary gradient with `Zap` or `Bell` icon

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/SubscribeForUpdates.tsx` | Reusable email capture form component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/GuidePrintSettings.tsx` | Import and add `<SubscribeForUpdates />` |
| `src/pages/GuideTroubleshooting.tsx` | Import and add `<SubscribeForUpdates />` |
| `src/pages/ResourcesProfiles.tsx` | Import and add `<SubscribeForUpdates />` |

---

### No Backend Required

This implementation uses a simulated submission (same as the existing ComingSoonPage). When you're ready to actually collect emails, a database table and edge function can be added later.
