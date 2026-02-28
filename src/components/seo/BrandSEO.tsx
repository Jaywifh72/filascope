import { useDocumentHead } from '@/hooks/useDocumentHead';
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

  // Always use structured template to avoid truncated "about" text
  const materialList = materials.length > 0
    ? materials.slice(0, 3).join(', ') + ' & more'
    : 'PLA, PETG, ABS & more';
  const seoDescription = productCount
    ? `Compare ${productCount} ${brandName} 3D printer filaments. Specs, live pricing, HueForge TD values & reviews. ${materialList} on FilaScope.`
    : `Compare ${brandName} 3D printer filaments. Specs, live pricing, HueForge TD values & reviews. ${materialList} on FilaScope.`;

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

  useDocumentHead({
    title: seoTitle,
    description: seoDescription,
    canonical: fullUrl,
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogUrl: fullUrl,
    ogType: 'website',
    ogImage: ogImageUrl,
    ogSiteName: 'FilaScope',
    twitterCard: 'summary_large_image',
    twitterSite: '@FilaScope',
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: ogImageUrl,
    keywords: `${brandName} filament, ${brandName} PLA, ${brandName} PETG, ${materials.slice(0, 3).join(', ')}, 3D printing, filament reviews, filament prices`,
    rating: rating && rating > 0 ? rating.toString() : undefined,
  });

  return null;
}
