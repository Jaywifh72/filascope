import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://filascope.com';

// UUID pattern to detect and prevent UUID-based canonical URLs
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Adds canonical link and og:url meta tags to every page.
 * Uses the current pathname without query parameters or trailing slashes.
 * This prevents duplicate content issues from region/currency URL variations.
 * 
 * Safety: If the pathname contains a UUID, this component does NOT render a canonical tag,
 * deferring to page-specific SEO components (ProductSEO, BrandSEO) which have access
 * to the correct slug.
 */
export function CanonicalLink() {
  const location = useLocation();
  
  // Remove trailing slash (but keep root "/" as is)
  const pathname = location.pathname === '/' 
    ? '/' 
    : location.pathname.replace(/\/$/, '');
  
  // If the pathname contains a UUID, skip rendering canonical here.
  // The page-specific SEO component (ProductSEO, BrandSEO) will provide the correct slug-based canonical.
  if (UUID_PATTERN.test(pathname)) {
    return null;
  }
  
  const canonicalUrl = `${BASE_URL}${pathname}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
      {/* Global defaults — page-specific SEO components override og:url/canonical */}
      <meta property="og:site_name" content="FilaScope" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@FilaScope" />
    </Helmet>
  );
}
