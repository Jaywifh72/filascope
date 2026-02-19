import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EXCLUDED_PREFIXES = ['/admin', '/settings', '/auth', '/maintenance', '/old-admin'];
const BASE_URL = 'https://filascope.com';

/**
 * Regional hreflang mapping.
 * Each entry: { hreflang, regionParam }
 * - regionParam is appended as ?region=XX
 * - x-default points to the bare canonical URL (no region param)
 */
const REGIONAL_HREFLANGS = [
  { hreflang: 'en-US', regionParam: 'US' },
  { hreflang: 'en-CA', regionParam: 'CA' },
  { hreflang: 'en-GB', regionParam: 'UK' },
  { hreflang: 'en-AU', regionParam: 'AU' },
  { hreflang: 'de',    regionParam: 'EU' },
  { hreflang: 'ja',    regionParam: 'JP' },
  { hreflang: 'zh',    regionParam: 'CN' },
] as const;

export const HreflangTags = () => {
  const { pathname } = useLocation();
  const isExcluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const canonicalHref = `${BASE_URL}${cleanPath}`;

  useEffect(() => {
    if (isExcluded) return;

    const entries = [
      // One hreflang per supported region
      ...REGIONAL_HREFLANGS.map(({ hreflang, regionParam }) => ({
        hreflang,
        href: `${canonicalHref}?region=${regionParam}`,
      })),
      // x-default → bare canonical, no region param
      { hreflang: 'x-default', href: canonicalHref },
    ];

    const elements = entries.map(({ hreflang, href }) => {
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
  }, [canonicalHref, isExcluded]);

  return null;
};
