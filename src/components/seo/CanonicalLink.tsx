import { useLocation } from 'react-router-dom';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const BASE_URL = 'https://filascope.com';

// UUID pattern to detect and prevent UUID-based canonical URLs
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Routes where page-specific SEO components (ProductSEO, BrandSEO) handle canonical/meta tags.
// CanonicalLink must NOT render on these to avoid duplicates.
const DETAIL_ROUTE_PREFIXES = ['/filament/', '/printer/', '/brand/', '/brands/', '/accessory/'];

/**
 * Sets canonical link and og:url for every non-detail page.
 * Uses the current pathname without query parameters or trailing slashes.
 * Skips detail pages and UUID paths, deferring to page-specific SEO components.
 */
export function CanonicalLink() {
  const location = useLocation();
  
  // Remove trailing slash (but keep root "/" as is)
  const pathname = location.pathname === '/' 
    ? '/' 
    : location.pathname.replace(/\/$/, '');
  
  // Skip on detail pages — their SEO components handle everything
  const isDetailPage = DETAIL_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
  const isUUID = UUID_PATTERN.test(pathname);
  const skip = isDetailPage || isUUID;

  const canonicalUrl = `${BASE_URL}${pathname}`;

  // Always call the hook (rules of hooks) but pass undefined when skipping
  useDocumentHead(skip ? {} : {
    canonical: canonicalUrl,
    ogUrl: canonicalUrl,
    ogType: 'website',
    ogSiteName: 'FilaScope',
    ogImage: 'https://filascope.com/og-image.png',
    twitterCard: 'summary_large_image',
    twitterSite: '@FilaScope',
    twitterImage: 'https://filascope.com/og-image.png',
  });

  return null;
}
