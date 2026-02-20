import { useJsonLd } from './useJsonLd';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  foundingDate?: string;
  knowsAbout?: string[];
}

export function OrganizationSchema({
  name = 'FilaScope',
  url = 'https://filascope.com',
  logo = 'https://filascope.com/og-image.png',
  description = 'The most comprehensive 3D printer filament database. Compare prices, materials, specifications, and HueForge TD values across 1,080+ filaments from 48+ brands.',
  sameAs = [
    'https://twitter.com/filascope',
    'https://discord.gg/filascope',
    'https://youtube.com/@filascope',
    'https://reddit.com/r/filascope',
  ],
  foundingDate = '2024',
  knowsAbout = [
    '3D printing filament',
    'HueForge transmissivity data',
    'filament comparison',
    'lithophane printing',
    '3D printer compatibility',
    'filament pricing',
  ],
}: OrganizationSchemaProps) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: { '@type': 'ImageObject', url: logo },
    description,
    ...(sameAs.length > 0 && { sameAs }),
    foundingDate,
    knowsAbout,
  });

  return null;
}

