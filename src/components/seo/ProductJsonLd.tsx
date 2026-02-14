import { Helmet } from 'react-helmet-async';
import { useRegion } from '@/contexts/RegionContext';
import { RegionCode, CurrencyCode } from '@/types/regional';

interface RegionalOffer {
  region: RegionCode;
  price: number;
  currency: CurrencyCode;
  url?: string;
  availability?: boolean;
  sellerName?: string;
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  image?: string | null;
  brand?: string | null;
  sku?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  material?: string | null;
  color?: string | null;
  url: string;
  price?: number | null;
  currency?: CurrencyCode;
  availability?: boolean;
  // Regional pricing support
  regionalOffers?: RegionalOffer[];
  // Aggregate rating support (FilaScope scores)
  ratingValue?: number | null;
  ratingCount?: number | null;
  bestRating?: number;
  worstRating?: number;
  // Technical specs for additionalProperty
  transmissionDistance?: number | null;
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  tensileStrength?: number | null;
  printSpeedMax?: number | null;
  weightGrams?: number | null;
  diameter?: number | null;
  // Printer-specific
  buildVolume?: { x: number; y: number; z: number } | null;
  maxPrintSpeed?: number | null;
  printerType?: string | null;
}

const REGION_COUNTRY_CODES: Record<RegionCode, string> = {
  US: 'US',
  CA: 'CA',
  UK: 'GB',
  EU: 'DE', // Use Germany as representative for EU
  AU: 'AU',
  JP: 'JP',
  CN: 'CN',
};

export function ProductJsonLd({
  name,
  description,
  image,
  brand,
  sku,
  gtin,
  mpn,
  material,
  color,
  url,
  price,
  currency,
  availability = true,
  regionalOffers,
  ratingValue,
  ratingCount,
  bestRating = 10,
  worstRating = 0,
  transmissionDistance,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  tensileStrength,
  printSpeedMax,
  weightGrams,
  diameter,
  buildVolume,
  maxPrintSpeed,
  printerType,
}: ProductJsonLdProps) {
  const { currency: userCurrency, region: userRegion } = useRegion();
  
  const activeCurrency = currency || (userCurrency as CurrencyCode);
  
  // Build additionalProperty array for technical specs
  const additionalProperties: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
    unitCode?: string;
    description?: string;
  }> = [];

  // TD Value for HueForge - critical for SEO targeting
  if (transmissionDistance) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'HueForge Transmission Distance (TD)',
      value: transmissionDistance,
      unitCode: 'MMT',
      description: 'Light transmission value for HueForge lithophane and multicolor printing',
    });
    
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'HueForge Compatibility',
      value: 'Verified Compatible',
    });
  }

  // Temperature ranges
  if (nozzleTempMin && nozzleTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Nozzle Temperature Range',
      value: `${nozzleTempMin}-${nozzleTempMax}`,
      unitCode: 'CEL',
    });
  } else if (nozzleTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Max Nozzle Temperature',
      value: nozzleTempMax,
      unitCode: 'CEL',
    });
  }

  if (bedTempMin && bedTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Bed Temperature Range',
      value: `${bedTempMin}-${bedTempMax}`,
      unitCode: 'CEL',
    });
  } else if (bedTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Max Bed Temperature',
      value: bedTempMax,
      unitCode: 'CEL',
    });
  }

  // Mechanical properties
  if (tensileStrength) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Tensile Strength',
      value: tensileStrength,
      unitCode: 'MPA',
    });
  }

  if (printSpeedMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Maximum Print Speed',
      value: printSpeedMax,
      unitCode: 'MMT',
    });
  }

  if (weightGrams) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Net Weight',
      value: weightGrams,
      unitCode: 'GRM',
    });
  }

  if (diameter) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Filament Diameter',
      value: diameter,
      unitCode: 'MMT',
    });
  }

  // Printer-specific properties
  if (buildVolume) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Build Volume',
      value: `${buildVolume.x}x${buildVolume.y}x${buildVolume.z}`,
      unitCode: 'MMT',
      description: 'Maximum print dimensions (X×Y×Z) in millimeters',
    });
  }

  if (maxPrintSpeed) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Maximum Print Speed',
      value: maxPrintSpeed,
      unitCode: 'MMT',
      description: 'Maximum print speed in mm/s',
    });
  }

  if (printerType) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Printer Type',
      value: printerType,
    });
  }

  // Build offers array for regional pricing (Schema.org AggregateOffer)
  const buildOffers = () => {
    // If we have regional offers, create AggregateOffer + individual Offers
    if (regionalOffers && regionalOffers.length > 0) {
      // All offer prices are already in user's currency (converted by detail pricing hook)
      const prices = regionalOffers.map(o => o.price).filter(p => p > 0);
      if (prices.length === 0) return undefined;

      return {
        '@type': 'AggregateOffer',
        priceCurrency: activeCurrency,
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: regionalOffers.length,
        availability: regionalOffers.some(o => o.availability !== false)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        offers: regionalOffers.map(offer => ({
          '@type': 'Offer',
          priceCurrency: activeCurrency,
          price: offer.price.toFixed(2),
          availability: offer.availability !== false
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: offer.url || url,
          ...(offer.sellerName && {
            seller: {
              '@type': 'Organization',
              name: offer.sellerName,
            },
          }),
          ...(offer.region && {
            eligibleRegion: {
              '@type': 'Place',
              name: REGION_COUNTRY_CODES[offer.region],
            },
          }),
        })),
      };
    }

    // Single offer fallback
    if (price) {
      return {
        '@type': 'Offer',
        priceCurrency: activeCurrency,
        price: price.toFixed(2),
        availability: availability
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url,
        eligibleRegion: {
          '@type': 'Place',
          name: REGION_COUNTRY_CODES[userRegion as RegionCode] || 'US',
        },
      };
    }

    return undefined;
  };

  const offers = buildOffers();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(image && { image }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    category: printerType 
      ? `3D Printer - ${printerType}`
      : `3D Printer Filament${material ? ` - ${material}` : ''}`,
    ...(material && { material }),
    ...(color && { color }),
    ...(sku && { sku }),
    ...(gtin && { gtin13: gtin }),
    ...(mpn && { mpn }),
    url,
    // Weight as QuantitativeValue (Schema.org standard)
    ...(weightGrams && {
      weight: {
        '@type': 'QuantitativeValue',
        value: weightGrams >= 1000 ? +(weightGrams / 1000).toFixed(2) : weightGrams,
        unitCode: weightGrams >= 1000 ? 'KGM' : 'GRM',
      },
    }),
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
    ...(offers && { offers }),
    // Aggregate rating from community reviews
    ...(ratingValue != null && ratingCount != null && ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue.toFixed(1),
        bestRating: bestRating.toString(),
        worstRating: worstRating.toString(),
        ratingCount: ratingCount.toString(),
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
