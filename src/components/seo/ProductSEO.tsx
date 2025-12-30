import { Helmet } from 'react-helmet-async';

interface ProductSEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  image?: string | null;
  brand?: string | null;
  material?: string | null;
  price?: number | null;
  currency?: string;
  availability?: boolean;
  transmissionDistance?: number | null;
}

export function ProductSEO({
  title,
  description,
  canonicalUrl,
  image,
  brand,
  material,
  price,
  currency = 'USD',
  availability = true,
  transmissionDistance,
}: ProductSEOProps) {
  // Build SEO-optimized title
  const seoTitle = transmissionDistance 
    ? `${title} - TD ${transmissionDistance} HueForge Compatible | FilaScope`
    : `${title} | FilaScope`;

  // Build meta description with key specs
  const seoDescription = description.length > 160 
    ? description.substring(0, 157) + '...'
    : description;

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
      <meta property="og:type" content="product" />
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

      {/* Product-specific meta */}
      {brand && <meta property="product:brand" content={brand} />}
      {material && <meta property="product:category" content={`3D Printer Filament - ${material}`} />}
      {price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}
      <meta property="product:availability" content={availability ? 'in stock' : 'out of stock'} />
    </Helmet>
  );
}
