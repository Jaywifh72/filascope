import { Helmet } from 'react-helmet-async';
import { useRegion } from '@/contexts/RegionContext';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { buildOgImageUrl } from '@/lib/ogImageUrl';

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
  /** Hex color code for the filament color (used for OG image accent) */
  colorHex?: string | null;
  /** Featured product image URL */
  featuredImage?: string | null;
  /** Override region for SEO purposes */
  region?: RegionCode;
  /** Product type for category meta */
  productType?: 'filament' | 'printer' | 'accessory';
}

/** Max title length for SEO (Google truncates at ~60) */
const MAX_TITLE_LENGTH = 65;
const SUFFIX = ' | FilaScope';

/**
 * Generate a clean, concise SEO title that fits within MAX_TITLE_LENGTH.
 * Progressive shortening: drop "Filament", then truncate with "...".
 */
function generateSeoTitle(
  title: string,
  opts: { material?: string | null; color?: string | null; transmissionDistance?: number | null; productType?: string }
): string {
  const { material, color, transmissionDistance, productType } = opts;

  // HueForge variant
  if (transmissionDistance) {
    const candidate = `${title} — TD ${transmissionDistance} HueForge${SUFFIX}`;
    return candidate.length <= MAX_TITLE_LENGTH ? candidate : `${title.substring(0, MAX_TITLE_LENGTH - SUFFIX.length - 3)}...${SUFFIX}`;
  }

  // Build material tag (e.g. "PLA Filament" or just "PLA")
  const matShort = material || (productType === 'printer' ? '' : 'Filament');

  // Build core: "{title} {Color} — {Material} Filament | FilaScope"
  const colorPart = color ? ` ${color}` : '';
  const matFull = matShort ? ` — ${matShort} Filament` : '';
  const matNoFilament = matShort ? ` — ${matShort}` : '';

  // Try full version first
  let candidate = `${title}${colorPart}${matFull}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  // Drop "Filament"
  candidate = `${title}${colorPart}${matNoFilament}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  // Drop color
  candidate = `${title}${matNoFilament}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  // Drop material
  candidate = `${title}${SUFFIX}`;
  if (candidate.length <= MAX_TITLE_LENGTH) return candidate;

  // Truncate title
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
  const { region: userRegion, currency: userCurrency, currencyConfig } = useRegion();
  
  // Use override region or user's current region
  const activeRegion = overrideRegion || userRegion;
  const activeCurrency = currency || (userCurrency as CurrencyCode);
  const regionName = REGION_NAMES[activeRegion] || activeRegion;

  // Build clean, concise SEO title (≤65 chars, no "Buy" prefix)
  const seoTitle = generateSeoTitle(title, { material, color, transmissionDistance, productType });

  // Use the description as-is — callers are responsible for building dynamic descriptions.
  // Only add HueForge note if transmission distance exists and isn't already mentioned.
  let metaDesc = description;
  
  if (transmissionDistance && !description.toLowerCase().includes('hueforge')) {
    metaDesc = `TD ${transmissionDistance} for HueForge lithophanes. ${description}`;
  }
  
  // Truncate to 160 chars
  const seoDescription = metaDesc.length > 160 
    ? metaDesc.substring(0, 157) + '...'
    : metaDesc;

  // Build full URL with region parameter for sharing
  const baseUrl = canonicalUrl.startsWith('http') 
    ? canonicalUrl 
    : `https://filascope.com${canonicalUrl}`;
  
  // Add region to canonical for regional pages
  const fullUrl = baseUrl.includes('?') 
    ? `${baseUrl}&region=${activeRegion}`
    : `${baseUrl}?region=${activeRegion}`;
  
  // Canonical should be without region for SEO consolidation
  const canonicalFullUrl = baseUrl;

  // Build dynamic OG image URL
  const ogImageUrl = buildOgImageUrl({
    type: 'product',
    title: brand ? `${brand} ${title}` : title,
    subtitle: material || undefined,
    price: price ? `From $${price}` : undefined,
    color: colorHex || undefined,
    image: featuredImage || image || undefined,
  });

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonicalFullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="FilaScope" />
      <meta property="og:locale" content={activeRegion === 'UK' ? 'en_GB' : activeRegion === 'AU' ? 'en_AU' : activeRegion === 'CA' ? 'en_CA' : 'en_US'} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      <meta property="twitter:image" content={ogImageUrl} />

      {/* Product-specific meta */}
      {brand && <meta property="product:brand" content={brand} />}
      {material && <meta property="product:category" content={`3D Printer ${productType === 'printer' ? 'Printer' : 'Filament'} - ${material}`} />}
      {price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={activeCurrency} />
        </>
      )}
      <meta property="product:availability" content={availability ? 'in stock' : 'out of stock'} />
      <meta property="product:target_country" content={activeRegion} />
      
      {/* HueForge-specific meta */}
      {transmissionDistance && (
        <>
          <meta name="keywords" content={`HueForge, TD value, transmission distance, ${material || 'filament'}, ${brand || '3D printing'}, lithophane, multicolor printing, buy ${regionName}`} />
          <meta property="product:transmission_distance" content={transmissionDistance.toString()} />
        </>
      )}
      
      {/* Geo targeting */}
      <meta name="geo.region" content={activeRegion} />
    </Helmet>
  );
}
