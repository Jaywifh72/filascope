import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EXCLUDED_PREFIXES = ['/admin', '/settings', '/auth', '/maintenance', '/old-admin'];
const BASE_URL = 'https://filascope.com';

export const HreflangTags = () => {
  const { pathname } = useLocation();
  const isExcluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const href = `${BASE_URL}${cleanPath}`;

  useEffect(() => {
    if (isExcluded) return;

    const langs = [
      { hreflang: 'en', href },
      { hreflang: 'x-default', href },
    ];

    const elements = langs.map(({ hreflang, href }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
      return link;
    });

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, [href, isExcluded]);

  return null;
};
