import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://filascope.com';

/**
 * Adds canonical link and og:url meta tags to every page.
 * Uses the current pathname without query parameters or trailing slashes.
 * This prevents duplicate content issues from region/currency URL variations.
 */
export function CanonicalLink() {
  const location = useLocation();
  
  // Remove trailing slash (but keep root "/" as is)
  const pathname = location.pathname === '/' 
    ? '/' 
    : location.pathname.replace(/\/$/, '');
  
  const canonicalUrl = `${BASE_URL}${pathname}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  );
}
