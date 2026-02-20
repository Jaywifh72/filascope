import { useJsonLd } from './useJsonLd';
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
  compatiblePrinters?: Array<{ modelName: string; brandName: string | null }>;
  editorialReviewBody?: string | null;
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
  // Aggregate rating support (community reviews)
  ratingValue?: number | null;
  ratingCount?: number | null;
  bestRating?: number;
  worstRating?: number;
  // Individual review entries for Product rich results
  reviews?: {
    authorName: string;
    datePublished: string;
    ratingValue: number;
    reviewBody: string | null;
    headline: string | null;
  }[];
  // Shipping & return policy for Merchant Center eligibility
  shippingRegions?: RegionCode[];
  hasReturnPolicy?: boolean;
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
  // New: color hex, FilaScore, dateModified
  colorHex?: string | null;
  filaScopeScore?: number | null;
  dateModified?: string | null;
  // Printer-specific
  buildVolume?: { x: number; y: number; z: number } | null;
  maxPrintSpeed?: number | null;
  printerType?: string | null;
  // Extended printer specs
  hasEnclosure?: boolean | null;
  hasWifi?: boolean | null;
  multiMaterialSupported?: boolean | null;
  multiMaterialMaxSpools?: number | null;
  extruderType?: string | null;
  directDrive?: boolean | null;
  autoBedLeveling?: boolean | null;
  inputShapingSupported?: boolean | null;
  supportedMaterials?: string | null;
  printerWeightKg?: number | null;
  printerWidthMm?: number | null;
  printerDepthMm?: number | null;
  printerHeightMm?: number | null;
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

/** ISO 3166-1 alpha-2 country name for schema.org Country type */
const REGION_COUNTRY_NAMES: Record<RegionCode, string> = {
  US: 'United States',
  CA: 'Canada',
  UK: 'United Kingdom',
  EU: 'Germany',
  AU: 'Australia',
  JP: 'Japan',
  CN: 'China',
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
  bestRating,
  worstRating,
  reviews,
  shippingRegions,
  hasReturnPolicy = true,
  transmissionDistance,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  tensileStrength,
  printSpeedMax,
  weightGrams,
  diameter,
  colorHex,
  filaScopeScore,
  dateModified,
  buildVolume,
  maxPrintSpeed,
  printerType,
  hasEnclosure,
  hasWifi,
  multiMaterialSupported,
  multiMaterialMaxSpools,
  extruderType,
  directDrive,
  autoBedLeveling,
  inputShapingSupported,
  supportedMaterials,
  printerWeightKg,
  printerWidthMm,
  printerDepthMm,
  printerHeightMm,
  compatiblePrinters,
  editorialReviewBody,
}: ProductJsonLdProps) {
  const { currency: userCurrency, region: userRegion } = useRegion();
  
  const activeCurrency = currency || (userCurrency as CurrencyCode);
  
  // Build additionalProperty array for technical specs
  const additionalProperties: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
    unitCode?: string;
    unitText?: string;
    description?: string;
  }> = [];

  // TD Value for HueForge - critical for SEO targeting
  if (transmissionDistance) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'HueForge Transmissivity Distance (TD)',
      value: transmissionDistance,
      unitCode: 'MMT',
      unitText: 'mm',
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

  // Extended printer-specific properties
  if (hasEnclosure != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Enclosure', value: hasEnclosure ? 'Enclosed' : 'Open Frame' });
  if (hasWifi != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Wi-Fi Connectivity', value: hasWifi ? 'Yes' : 'No' });
  if (multiMaterialSupported) additionalProperties.push({ '@type': 'PropertyValue', name: 'Multi-Material Support', value: multiMaterialMaxSpools ? `Yes (${multiMaterialMaxSpools} colors)` : 'Yes' });
  if (extruderType) additionalProperties.push({ '@type': 'PropertyValue', name: 'Extruder Type', value: extruderType });
  if (directDrive != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Drive Type', value: directDrive ? 'Direct Drive' : 'Bowden' });
  if (autoBedLeveling != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Auto Bed Leveling', value: autoBedLeveling ? 'Yes' : 'No' });
  if (inputShapingSupported != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Input Shaping', value: inputShapingSupported ? 'Yes' : 'No' });
  if (supportedMaterials) additionalProperties.push({ '@type': 'PropertyValue', name: 'Compatible Materials', value: supportedMaterials });

  // Color hex and FilaScore
  if (colorHex) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Color Hex Code',
      value: colorHex,
    });
  }
  if (filaScopeScore != null) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'FilaScope',
      value: filaScopeScore,
      description: 'FilaScope quality rating out of 10',
    });
  }

  // Build shipping details for supported regions
  const buildShippingDetails = () => {
    const regions = shippingRegions ?? (['US', 'CA', 'UK', 'AU', 'EU'] as RegionCode[]);
    return regions.map(r => ({
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: activeCurrency,
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: REGION_COUNTRY_CODES[r],
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 1,
          maxValue: 3,
          unitCode: 'DAY',
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 2,
          maxValue: 14,
          unitCode: 'DAY',
        },
      },
    }));
  };

  // Return policy for Merchant Center eligibility
  const returnPolicy = hasReturnPolicy
    ? {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      }
    : undefined;

  // Build offers array for regional pricing (Schema.org AggregateOffer)
  const buildOffers = () => {
    const shippingDetails = buildShippingDetails();

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
        ...(returnPolicy && { hasMerchantReturnPolicy: returnPolicy }),
        offers: regionalOffers.map(offer => ({
          '@type': 'Offer',
          priceCurrency: offer.currency || activeCurrency,
          price: offer.price.toFixed(2),
          availability: offer.availability !== false
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: offer.url || url,
          shippingDetails,
          ...(offer.sellerName && {
            seller: {
              '@type': 'Organization',
              name: offer.sellerName,
            },
          }),
          // Use areaServed + Country for proper regional structured data
          ...(offer.region && {
            areaServed: {
              '@type': 'Country',
              name: REGION_COUNTRY_NAMES[offer.region] || REGION_COUNTRY_CODES[offer.region],
              identifier: REGION_COUNTRY_CODES[offer.region],
            },
          }),
        })),
      };
    }

    // Single offer — always emit at least an availability/url offer so
    // Google doesn't flag the Product schema as missing 'offers'.
    return {
      '@type': 'Offer',
      priceCurrency: activeCurrency,
      ...(price != null && { price: price.toFixed(2) }),
      availability: availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url,
      shippingDetails,
      ...(returnPolicy && { hasMerchantReturnPolicy: returnPolicy }),
      areaServed: {
        '@type': 'Country',
        name: REGION_COUNTRY_NAMES[userRegion as RegionCode] || 'United States',
        identifier: REGION_COUNTRY_CODES[userRegion as RegionCode] || 'US',
      },
    };
  };

  const offers = buildOffers();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(dateModified && { dateModified }),
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
    // Physical dimensions for printers (Schema.org standard)
    ...(printerWeightKg && {
      weight: {
        '@type': 'QuantitativeValue',
        value: printerWeightKg,
        unitCode: 'KGM',
      },
    }),
    ...(printerWidthMm && {
      width: {
        '@type': 'QuantitativeValue',
        value: printerWidthMm,
        unitCode: 'MMT',
      },
    }),
    ...(printerDepthMm && {
      depth: {
        '@type': 'QuantitativeValue',
        value: printerDepthMm,
        unitCode: 'MMT',
      },
    }),
    ...(printerHeightMm && {
      height: {
        '@type': 'QuantitativeValue',
        value: printerHeightMm,
        unitCode: 'MMT',
      },
    }),
    // Weight as QuantitativeValue for filaments (Schema.org standard)
    ...(weightGrams && !printerWeightKg && {
      weight: {
        '@type': 'QuantitativeValue',
        value: weightGrams >= 1000 ? +(weightGrams / 1000).toFixed(2) : weightGrams,
        unitCode: weightGrams >= 1000 ? 'KGM' : 'GRM',
      },
    }),
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
    ...(offers && { offers }),
    // Aggregate rating — community reviews take priority; FilaScore is the fallback
    ...(ratingValue != null && ratingCount != null && ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue.toFixed(1),
        bestRating: bestRating.toString(),
        worstRating: worstRating.toString(),
        ratingCount: ratingCount.toString(),
        // reviewCount = number of actual written reviews (subset of ratingCount)
        ...(reviews && reviews.length > 0 && { reviewCount: reviews.length.toString() }),
      },
    }),
    // Compatible printers as isRelatedTo — schema-only, no UI
    ...(compatiblePrinters && compatiblePrinters.length > 0 && {
      isRelatedTo: compatiblePrinters.map((p) => ({
        '@type': 'Product',
        name: p.modelName,
        category: '3D Printer',
        ...(p.brandName && { brand: { '@type': 'Brand', name: p.brandName } }),
      })),
    }),
    // Build combined review array: editorial (FilaScope org) first, then community
    ...(() => {
      const allReviews: object[] = [];
      if (editorialReviewBody && filaScopeScore != null) {
        allReviews.push({
          '@type': 'Review',
          author: { '@type': 'Organization', name: 'FilaScope' },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: filaScopeScore.toFixed(1),
            bestRating: '10',
            worstRating: '1',
          },
          reviewBody: editorialReviewBody,
        });
      }
      if (reviews && reviews.length > 0) {
        allReviews.push(
          ...reviews.map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.authorName },
            datePublished: r.datePublished,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.ratingValue.toString(),
              bestRating: bestRating?.toString() ?? '5',
              worstRating: worstRating?.toString() ?? '1',
            },
            ...(r.headline && { name: r.headline }),
            ...(r.reviewBody && { reviewBody: r.reviewBody }),
          }))
        );
      }
      return allReviews.length > 0 ? { review: allReviews } : {};
    })(),
  };

  useJsonLd(jsonLd);
  return null;
}
