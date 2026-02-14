import { Helmet } from 'react-helmet-async';
import { buildOgImageUrl } from '@/lib/ogImageUrl';

interface BrandSEOProps {
  brandName: string;
  description?: string;
  canonicalUrl: string;
  image?: string | null;
  productCount?: number;
  materials?: string[];
  rating?: number | null;
  priceRange?: { low: string; high: string } | null;
}

export function BrandSEO({
  brandName,
  description,
  canonicalUrl,
  image,
  productCount,
  materials = [],
  rating,
  priceRange,
}: BrandSEOProps) {
  // Build SEO-optimized title — avoid "Filaments Filaments" for brands like "Spectrum Filaments"
  const nameHasFilaments = /filaments?/i.test(brandName);
  const seoTitle = nameHasFilaments
    ? `${brandName} — Prices, Reviews & Specs | FilaScope`
    : `${brandName} Filaments — Prices, Reviews & Specs | FilaScope`;

  // Build meta description with price range when available
  const priceStr = priceRange ? ` Prices from $${priceRange.low}–$${priceRange.high}.` : '';
  const defaultDesc = productCount && materials.length > 0
    ? `Explore ${productCount} ${brandName} filaments across ${materials.length} materials.${priceStr} Compare specs, check printer compatibility & find deals.`
    : productCount 
      ? `Explore ${productCount} ${brandName} filaments.${priceStr} Compare specs, check printer compatibility & find deals on FilaScope.`
      : `Browse ${brandName} 3D printing filaments. Compare prices, specifications, and availability on FilaScope.`;
  
  const seoDescription = (description || defaultDesc).length > 160 
    ? (description || defaultDesc).substring(0, 157) + '...'
    : (description || defaultDesc);

  const fullUrl = canonicalUrl.startsWith('http') 
    ? canonicalUrl 
    : `https://filascope.com${canonicalUrl}`;

  // Build dynamic OG image URL
  const nameHasFilamentsForOg = /filaments?/i.test(brandName);
  const ogImageUrl = buildOgImageUrl({
    type: 'brand',
    title: nameHasFilamentsForOg ? brandName : `${brandName} Filaments`,
    subtitle: productCount ? `${productCount} products` : undefined,
    image: image || undefined,
  });

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="FilaScope" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@FilaScope" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Brand-specific meta */}
      <meta name="keywords" content={`${brandName} filament, ${brandName} PLA, ${brandName} PETG, ${materials.slice(0, 3).join(', ')}, 3D printing, filament reviews, filament prices`} />
      
      {/* Rating if available */}
      {rating && rating > 0 && (
        <meta name="rating" content={rating.toString()} />
      )}
    </Helmet>
  );
}
