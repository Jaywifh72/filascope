
# Implementation Plan: Legal Pages (Privacy, Terms, Affiliate Disclosure)

## Overview
Create three legal pages linked from the site footer that are currently returning 404 errors. Each page will use a shared layout component for consistency and follow the established dark theme design patterns.

## Files to Create

### 1. Shared Layout Component
**File**: `src/components/legal/LegalPageLayout.tsx`

A reusable layout wrapper for all legal pages providing:
- Centered content container with `max-w-3xl`
- Page title as H1 with gradient text styling
- "Last Updated" date line in muted text
- Dark-theme prose styling for body content (gray-300 body text, white headings)
- Consistent padding and spacing following the 8px rhythm system
- Helmet integration for SEO

### 2. Privacy Policy Page
**File**: `src/pages/PrivacyPolicy.tsx`

Sections to include:
- **Information We Collect**: Email for newsletter subscription, region/currency preferences (localStorage), analytics data
- **Cookies**: Description of cookie usage for preferences and analytics
- **Third-Party Services**: Affiliate links to retailers (Amazon, brand stores)
- **Your Rights**: Data access, deletion requests
- **Contact**: hello@filascope.com
- **Changes to Policy**: How updates are communicated

### 3. Terms of Service Page
**File**: `src/pages/TermsOfService.tsx`

Sections to include:
- **Description of Service**: Filament database with pricing aggregated from third-party retailers
- **Accuracy Disclaimer**: Prices are scraped periodically and may not reflect real-time prices; verify on retailer sites
- **Affiliate Disclosure**: Brief mention that FilaScope earns commissions
- **Intellectual Property**: Content ownership and usage rights
- **Limitation of Liability**: Standard liability limitations
- **Governing Law**: Placeholder for jurisdiction

### 4. Affiliate Disclosure Page
**File**: `src/pages/AffiliateDisclosure.tsx`

Sections to include:
- **Transparency Statement**: Clear statement that FilaScope earns commissions from retailer links
- **Independence**: Commissions don't affect product scoring or rankings
- **Affiliate Programs**: List of participating programs (Amazon Associates, brand partnerships)
- **Pricing Information**: Prices fetched from retailers, may vary from actual prices
- **Questions**: Contact information for inquiries

## Router Configuration Update
**File**: `src/App.tsx`

Add three new lazy-loaded routes before the catch-all `*` route:
```typescript
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));

// In Routes:
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />
<Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
```

## Design Specifications

### Typography
- Page title: `text-3xl md:text-4xl font-bold` with gradient text
- Section headings (H2): `text-xl font-semibold text-white`
- Body text: `text-base text-gray-300 leading-relaxed`
- Lists: Bullet points with primary-colored dots

### Layout
- Full-height background: `min-h-screen bg-background`
- Container: `max-w-3xl mx-auto px-4 py-12 md:py-16`
- Section spacing: `space-y-8` between major sections
- Paragraph spacing: `space-y-4` within sections

### Visual Elements
- Subtle gradient hero area matching ReferenceMethodology pattern
- "Last updated" timestamp below title in muted text
- Back-to-home link at bottom of each page

## Implementation Order
1. Create `LegalPageLayout.tsx` component
2. Create `PrivacyPolicy.tsx` page
3. Create `TermsOfService.tsx` page
4. Create `AffiliateDisclosure.tsx` page
5. Update `App.tsx` with new routes

## Technical Notes
- All pages use `react-helmet-async` for SEO meta tags
- Follows existing lazy-loading pattern for route components
- No external dependencies required
- No database or API calls needed (static content pages)
