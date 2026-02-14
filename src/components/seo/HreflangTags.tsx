import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const EXCLUDED_PREFIXES = ['/admin', '/settings', '/auth', '/maintenance', '/old-admin'];
const BASE_URL = 'https://filascope.com';

export const HreflangTags = () => {
  const { pathname } = useLocation();

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  // Strip trailing slash (except root) for clean canonical-style URLs
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const href = `${BASE_URL}${cleanPath}`;

  return (
    <Helmet>
      <link rel="alternate" hrefLang="en" href={href} />
      <link rel="alternate" hrefLang="x-default" href={href} />
    </Helmet>
  );
};
