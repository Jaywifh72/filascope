import { useRegion } from '@/contexts/RegionContext';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { buildOgImageUrl } from '@/lib/ogImageUrl';
import { useDocumentHead } from '@/hooks/useDocumentHead';

interface ProductSEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  image?: string | null;
  brand?: string | null;
  material?: string | null;
  color?: string | null;
  price?: number | null;
  currency?: CurrencyCode;
  availability?: boolean;
  transmissionDistance?: number | null;
  colorHex?: string | null;
  featuredImage?: string | null;
  region?: RegionCode;
  productType?: 'filament' | 'printer' | 'accessory';
}

const MAX_TITLE_LENGTH = 65;
const SUFFIX = ' | FilaScope';

function generateSeoTitle(
  title: string,
  opts: { material?: string | null; color?: string | null; transmissionDistance?: number | null; productType?: string }
): string {
  const { material, color, transmissionDistance, productType } = opts;

  if (transmissionDistance) {
    const candidate = `${title} — TD ${transmissionDistance} HueForge${SUFFIX}`;
    return candidate.length <= MAX_TITLE_LENGTH ? candidate : `${title.substring(0, MAX_TITLE_LENGTH - SUFFIX.length - 3)}...${SUFFIX}`;
  }

  const matShort = material || (productType === 'printer' ? '' : 'Filament');
  // Note: `title` already includes the color (passed as seoFullName from FilamentDetail),
  // so we do NOT append colorPart here to avoid duplication like "Bronze Bronze".
  const matFull = matShort ? ` — ${matShort} Filament` : '';
  const matNoFilament = matShort ? ` — ${matShort}` : '';

  let candidate = `${title}${matFull}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  candidate = `${title}${matNoFilament}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  candidate = `${title}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  candidate = `${title}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  const maxTitleChars = MAX_TITLE_LENGTH - SUFFIX.length - 3;
  return `${title.substring(0, maxTitleChars)}...${SUFFIX}`;
}

const REGION_NAMES: Record<RegionCode, string> = {
  US: 'USA',
  CA: 'Canada',
  UK: 'UK',
  EU: 'Europe',
  AU: 'Australia',
  JP: 'Japan',
  CN: 'China',
};

export function ProductSEO({
  title,
  description,
  canonicalUrl,
  image,
  brand,
  material,
  color,
  price,
  currency,
  availability = true,
  transmissionDistance,
  region: overrideRegion,
  productType = 'filament',
  colorHex,
  featuredImage,
}: ProductSEOProps) {
  const { region: userRegion, currency: userCurrency } = useRegion();
  
  const activeRegion = overrideRegion || userRegion;
  const activeCurrency = currency || (userCurrency as CurrencyCode);
  const regionName = REGION_NAMES[activeRegion] || activeRegion;

  const seoTitle = generateSeoTitle(title, { material, color, transmissionDistance, productType });

  let metaDesc = description;
  if (transmissionDistance && !description.toLowerCase().includes('hueforge')) {
    metaDesc = `TD ${transmissionDistance} for HueForge lithophanes. ${description}`;
  }
  const seoDescription = metaDesc.length > 160 ? metaDesc.substring(0, 157) + '...' : metaDesc;

  const baseUrl = canonicalUrl.startsWith('http') ? canonicalUrl : `https://filascope.com${canonicalUrl}`;
  const fullUrl = baseUrl.includes('?') ? `${baseUrl}&region=${activeRegion}` : `${baseUrl}?region=${activeRegion}`;
  const canonicalFullUrl = baseUrl;

  const ogImageUrl = buildOgImageUrl({
    type: 'product',
    title: brand ? `${brand} ${title}` : title,
    subtitle: material || undefined,
    price: price ? `From $${price}` : undefined,
    color: colorHex || undefined,
    image: featuredImage || image || undefined,
  });

  const ogLocale = activeRegion === 'UK' ? 'en_GB' : activeRegion === 'AU' ? 'en_AU' : activeRegion === 'CA' ? 'en_CA' : 'en_US';

  useDocumentHead({
    title: seoTitle,
    description: seoDescription,
    canonical: canonicalFullUrl,
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogUrl: fullUrl,
    ogType: 'product',
    ogImage: ogImageUrl,
    ogSiteName: 'FilaScope',
    ogLocale,
    twitterCard: 'summary_large_image',
    twitterSite: '@FilaScope',
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: ogImageUrl,
    keywords: transmissionDistance
      ? `HueForge, TD value, transmission distance, ${material || 'filament'}, ${brand || '3D printing'}, lithophane, multicolor printing, buy ${regionName}`
      : undefined,
    geoRegion: activeRegion,
    productBrand: brand || undefined,
    productCategory: material ? `3D Printer ${productType === 'printer' ? 'Printer' : 'Filament'} - ${material}` : undefined,
    productPriceAmount: price ? price.toString() : undefined,
    productPriceCurrency: price ? activeCurrency : undefined,
    productAvailability: availability ? 'in stock' : 'out of stock',
    productTargetCountry: activeRegion,
    productTransmissionDistance: transmissionDistance ? transmissionDistance.toString() : undefined,
  });

  return null;
}
