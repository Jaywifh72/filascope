import { Helmet } from 'react-helmet-async';
import { useRegion } from '@/contexts/RegionContext';
import { RegionCode, CurrencyCode } from '@/types/regional';

interface ProductSEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  image?: string | null;
  brand?: string | null;
  material?: string | null;
  price?: number | null;
  currency?: CurrencyCode;
  availability?: boolean;
  transmissionDistance?: number | null;
  /** Override region for SEO purposes */
  region?: RegionCode;
  /** Product type for category meta */
  productType?: 'filament' | 'printer' | 'accessory';
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
  price,
  currency,
  availability = true,
  transmissionDistance,
  region: overrideRegion,
  productType = 'filament',
}: ProductSEOProps) {
  const { region: userRegion, currency: userCurrency, currencyConfig } = useRegion();
  
  // Use override region or user's current region
  const activeRegion = overrideRegion || userRegion;
  const activeCurrency = currency || (userCurrency as CurrencyCode);
  const regionName = REGION_NAMES[activeRegion] || activeRegion;

  // Build SEO-optimized title with region targeting
  let seoTitle: string;
  
  if (transmissionDistance) {
    // HueForge targeting
    seoTitle = `${title} - TD ${transmissionDistance} HueForge Filament | FilaScope`;
  } else if (productType === 'printer') {
    // Printer with region
    seoTitle = `Buy ${title} in ${regionName} | FilaScope`;
  } else {
    // Filament with region
    seoTitle = brand 
      ? `Buy ${brand} ${material || ''} in ${regionName} | FilaScope`
      : `${title} | FilaScope`;
  }

  // Build meta description with key specs, price, and region
  let metaDesc = description;
  
  // Add HueForge targeting if applicable
  if (transmissionDistance && !description.toLowerCase().includes('hueforge')) {
    metaDesc = `TD ${transmissionDistance} for HueForge lithophanes. ${description}`;
  }
  
  // Add regional availability note
  if (price) {
    const priceStr = `From ${currencyConfig.symbol}${price.toFixed(2)}`;
    if (!metaDesc.includes(priceStr)) {
      metaDesc = `${metaDesc} ${priceStr} in ${regionName}.`;
    }
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
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content="FilaScope" />
      <meta property="og:locale" content={activeRegion === 'UK' ? 'en_GB' : activeRegion === 'AU' ? 'en_AU' : activeRegion === 'CA' ? 'en_CA' : 'en_US'} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      {image && <meta property="twitter:image" content={image} />}

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
