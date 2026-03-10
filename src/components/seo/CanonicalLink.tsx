import { useLocation } from 'react-router-dom';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const BASE_URL = 'https://filascope.com';

/**
 * Sets a baseline canonical link and og:url for every page.
 * Page-specific SEO components (ProductSEO, BrandSEO, etc.) will override
 * via their own useDocumentHead call — last-write-wins on the DOM element.
 * Uses the current pathname without query parameters or trailing slashes.
 */
export function CanonicalLink() {
  const location = useLocation();

  // Remove trailing slash (but keep root "/" as is)
  const pathname = location.pathname === '/'
    ? '/'
    : location.pathname.replace(/\/$/, '');

  const canonicalUrl = `${BASE_URL}${pathname}`;

  useDocumentHead({
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
