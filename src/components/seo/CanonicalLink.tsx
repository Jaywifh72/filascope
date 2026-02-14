import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://filascope.com';

// UUID pattern to detect and prevent UUID-based canonical URLs
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Routes where page-specific SEO components (ProductSEO, BrandSEO) handle canonical/meta tags.
// CanonicalLink must NOT render on these to avoid duplicates.
const DETAIL_ROUTE_PREFIXES = ['/filament/', '/printer/', '/brand/', '/accessory/'];

/**
 * Adds canonical link and og:url meta tags to every page.
 * Uses the current pathname without query parameters or trailing slashes.
 * This prevents duplicate content issues from region/currency URL variations.
 * 
 * Safety: Skips rendering on detail pages (filament, printer, brand, accessory)
 * and UUID paths, deferring to page-specific SEO components which set their own
 * canonical, description, and OG tags.
 */
export function CanonicalLink() {
  const location = useLocation();
  
  // Remove trailing slash (but keep root "/" as is)
  const pathname = location.pathname === '/' 
    ? '/' 
    : location.pathname.replace(/\/$/, '');
  
  // Skip on detail pages — their SEO components handle everything
  const isDetailPage = DETAIL_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
  if (isDetailPage) {
    return null;
  }

  // If the pathname contains a UUID, skip rendering canonical here.
  if (UUID_PATTERN.test(pathname)) {
    return null;
  }
  
  const canonicalUrl = `${BASE_URL}${pathname}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
      {/* Global defaults for non-detail pages */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FilaScope" />
      <meta property="og:image" content="https://filascope.com/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@FilaScope" />
      <meta name="twitter:image" content="https://filascope.com/og-image.png" />
    </Helmet>
  );
}
