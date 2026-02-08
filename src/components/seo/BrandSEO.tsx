import { Helmet } from 'react-helmet-async';

interface BrandSEOProps {
  brandName: string;
  description?: string;
  canonicalUrl: string;
  image?: string | null;
  productCount?: number;
  materials?: string[];
  rating?: number | null;
}

export function BrandSEO({
  brandName,
  description,
  canonicalUrl,
  image,
  productCount,
  materials = [],
  rating,
}: BrandSEOProps) {
  // Build SEO-optimized title
  const seoTitle = `${brandName} Filaments — Prices, Reviews & Specs | FilaScope`;

  // Build meta description — template: "[Brand] filaments — [X] products across [Y] material types. Compare specs, pricing, and availability on FilaScope."
  const materialList = materials.slice(0, 3).join(', ');
  const defaultDesc = productCount && materials.length > 0
    ? `${brandName} filaments — ${productCount} products across ${materials.length} material types. Live pricing, specs, and compatibility data on FilaScope.`
    : productCount 
      ? `${brandName} filaments — ${productCount} products including ${materialList || 'PLA, PETG, ABS'}. Live pricing, specs, and compatibility data on FilaScope.`
      : `Browse ${brandName} 3D printing filaments. Compare prices, specifications, and availability on FilaScope.`;
  
  const seoDescription = (description || defaultDesc).length > 160 
    ? (description || defaultDesc).substring(0, 157) + '...'
    : (description || defaultDesc);

  const fullUrl = canonicalUrl.startsWith('http') 
    ? canonicalUrl 
    : `https://filascope.com${canonicalUrl}`;

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
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content="FilaScope" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      {image && <meta property="twitter:image" content={image} />}

      {/* Brand-specific meta */}
      <meta name="keywords" content={`${brandName} filament, ${brandName} PLA, ${brandName} PETG, ${materialList}, 3D printing, filament reviews, filament prices`} />
      
      {/* Rating if available */}
      {rating && rating > 0 && (
        <meta name="rating" content={rating.toString()} />
      )}
    </Helmet>
  );
}
