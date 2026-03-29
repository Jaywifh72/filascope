import { useJsonLd, JsonLd } from './useJsonLd';

interface ContactPoint {
  type: string;
  email?: string;
  contactType: string;
  areaServed?: string | string[];
  availableLanguage?: string | string[];
}

interface PostalAddress {
  addressCountry: string;
  addressRegion?: string;
}

interface Person {
  name: string;
  jobTitle?: string;
}

interface OrganizationSchemaProps {
  name?: string;
  alternateName?: string;
  slogan?: string;
  url?: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  image?: string;
  description?: string;
  sameAs?: string[];
  foundingDate?: string;
  knowsAbout?: string[];
  contactPoint?: ContactPoint[];
  address?: PostalAddress;
  founders?: Person[];
  numberOfEmployees?: number;
  areaServed?: string | string[];
  serviceType?: string[];
}

export function OrganizationSchema({
  name = 'FilaScope',
  alternateName,
  slogan,
  url = 'https://filascope.com',
  logo = 'https://filascope.com/logo.png',
  logoWidth,
  logoHeight,
  image,
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
  contactPoint,
  address,
  founders,
  numberOfEmployees,
  areaServed,
  serviceType,
}: OrganizationSchemaProps) {
  const logoObject: Record<string, unknown> = {
    '@type': 'ImageObject',
    url: logo,
  };
  if (logoWidth) logoObject.width = logoWidth;
  if (logoHeight) logoObject.height = logoHeight;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(alternateName && { alternateName }),
    ...(slogan && { slogan }),
    url,
    logo: logoObject,
    ...(image && { image }),
    description,
    ...(sameAs.length > 0 && { sameAs }),
    foundingDate,
    knowsAbout,
    ...(contactPoint && {
      contactPoint: contactPoint.map((cp) => ({
        '@type': 'ContactPoint',
        contactType: cp.contactType,
        ...(cp.email && { email: cp.email }),
        ...(cp.areaServed && { areaServed: cp.areaServed }),
        ...(cp.availableLanguage && { availableLanguage: cp.availableLanguage }),
      })),
    }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: address.addressCountry,
        ...(address.addressRegion && { addressRegion: address.addressRegion }),
      },
    }),
    ...(founders && {
      founders: founders.map((f) => ({
        '@type': 'Person',
        name: f.name,
        ...(f.jobTitle && { jobTitle: f.jobTitle }),
      })),
    }),
    ...(numberOfEmployees !== undefined && {
      numberOfEmployees: { '@type': 'QuantitativeValue', value: numberOfEmployees },
    }),
    ...(areaServed && { areaServed }),
    ...(serviceType && { serviceType }),
  };

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}

